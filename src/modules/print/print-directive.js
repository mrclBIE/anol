angular.module('anol.print')
/**
 * @ngdoc directive
 * @name anol.print.directive:anolPrint
 *
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 * @requires anol.print.PrintService
 * @requires anol.print.PrintPageService
 *
 * @description
 * User print interface with default print attributes.
 * Default print attributes are:
 * **bbox**, **projection** and **layers**.
 * **layers** contains all currently active layers.
 *
 * When *startPrint* called default print arguments plus **tempalteValues** passed to anol.print.PrintService:startPrint.
 * **templateValues** contains all values added to **printAttributes**.
 * When using own print template, all inputs have to use **printAttributes.[name]** as *ng-model* statement.
 * *tempalteValues* can be extended by transclude input fields into directive. *ng-model* value for these fields have to be
 * *$parent.printAttributes.[name]*
 */
.directive('anolPrint', ['PrintService', 'PrintPageService', 'MapService', 'LayersService',
  function(PrintService, PrintPageService, MapService, LayersService) {
    return {
      restrict: 'A',
      templateUrl: function(tElement, tAttrs) {
        var defaultUrl = 'src/modules/print/templates/print.html';
        return tAttrs.templateUrl || defaultUrl;
      },
      scope: {
        showPrintArea: '='
      },
      transclude: true,
      link: {
        pre: function(scope, element, attrs) {
            scope.printAttributes = {
              pageSize: [],
              layout: undefined,
              scale: angular.copy(PrintPageService.defaultScale)
            };
            scope.isPrintableAttributes = {};
            scope.availableScales = PrintPageService.availableScales;
            scope.definedPageLayouts = PrintPageService.pageLayouts;
            scope.outputFormats = PrintPageService.outputFormats;
            if(angular.isArray(scope.outputFormats) && scope.outputFormats.length > 0) {
              scope.printAttributes.outputFormat = scope.outputFormats[0];
            }
            scope.prepareDownload = false;
            scope.downloadReady = false;
            scope.downloadError = false;

            var prepareOverlays = function(layers) {
              var _layers = [];
              angular.forEach(layers, function(layer) {
                if(layer instanceof anol.layer.Group) {
                  _layers = _layers.concat(prepareOverlays(layer.layers.slice().reverse()));
                } else {
                  if(layer.getVisible()) {
                    _layers.push(layer);
                  }
                }
              });
              return _layers;
            };

            scope.startPrint = function() {
              scope.downloadReady = false;
              scope.downloadError = false;
              scope.prepareDownload = true;

              var layers = [LayersService.activeBackgroundLayer()];
              layers = layers.concat(prepareOverlays(LayersService.overlayLayers));

              var downloadPromise = PrintService.startPrint({
                  bbox: PrintPageService.getBounds(),
                  projection: MapService.getMap().getView().getProjection().getCode(),
                  layers: layers,
                  templateValues: angular.copy(scope.printAttributes)
                }
              );

              downloadPromise.then(
                function(response) {
                  var downloadLink = element.find('.download-link');
                  downloadLink.attr('href', response.url);
                  downloadLink.attr('download', response.name);
                  scope.downloadReady = true;
                  scope.prepareDownload = false;
                  scope.removePrintArea();
                },
                function(reason) {
                  if(reason === 'replaced') {
                    return;
                  }
                  scope.prepareDownload = false;
                  scope.downloadError = true;
                }
              );
            };

            // if we assign pageSize = value in template angular put only a reverence
            // into scope.pageSize and typing somethink into width/height input fields
            // will result in modifying selected availablePageSize value
            scope.setPageLayout = function(size, layout) {
                scope.printAttributes.pageSize = PrintPageService.mapToPageSize(angular.copy(size));
                scope.printAttributes.layout = angular.copy(layout);

                var errors = PrintPageService.getSizeErrors(scope.printAttributes.pageSize);
                scope.anolPrint.pageWidth.$error.printPage = errors.width;
                scope.anolPrint.pageHeight.$error.printPage = errors.height;

                scope.updatePrintPage();
            };

            scope.updatePrintPage = function() {
              if(scope.havePageSize()) {
                PrintPageService.addFeatureFromPageSize(scope.printAttributes.pageSize, scope.printAttributes.scale);
              } else {
                PrintPageService.removePrintArea();
              }

              var errors = PrintPageService.getSizeErrors(scope.printAttributes.pageSize);
              scope.anolPrint.pageWidth.$error.printPage = errors.width;
              scope.anolPrint.pageHeight.$error.printPage = errors.height;
            };

            scope.updatePageSize = function() {
              scope.printAttributes.pageSize = [scope.pageWidth, scope.pageHeight];
              scope.printAttributes.layout = undefined;
              scope.updatePrintPage();
            };

            scope.havePageSize = function() {
              return PrintPageService.isValidPageSize(scope.printAttributes.pageSize);
            };

            scope.isPrintable = function() {
              if(scope.prepareDownload === true) {
                return false;
              }
              if(scope.printAttributes.scale === undefined || scope.printAttributes.scale <= 0) {
                  return false;
              }
              if(scope.printAttributes.outputFormat === undefined) {
                return false;
              }
              if(!angular.equals(scope.isPrintableAttributes, {})) {
                var reject = false;
                angular.forEach(scope.isPrintableAttributes, function(value) {
                  if(reject) {
                    return;
                  }
                  reject = value !== true;
                });
                if(reject) {
                  return false;
                }
              }
              return scope.havePageSize();
            };
            scope.removePrintArea = function() {
              PrintPageService.removePrintArea();
              scope.printAttributes.layout = undefined;
              scope.printAttributes.pageSize = undefined;

            };
        },
        post: function(scope, element, attrs) {
          scope.$watchCollection('printAttributes.pageSize',
            function(n) {
              if(angular.isDefined(n)) {
                scope.printAttributes.pageSize = n;
                if(n[0] !== null) {
                  scope.pageWidth = Math.round(n[0]);
                }
                if(n[1] !== null) {
                  scope.pageHeight = Math.round(n[1]);
                }
              }
            }
          );
          scope.$watch('showPrintArea', function(n) {
            if(n === true) {
              scope.updatePrintPage();
            } else if (n === false) {
              scope.removePrintArea();
            }
          });
        }
      }
  };
}]);
