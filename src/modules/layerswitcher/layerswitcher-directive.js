angular.module('anol.layerswitcher')

/**
 * @ngdoc directive
 * @name anol.layerswitcher.directive:anolLayerswitcher
 *
 * @restrict A
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsService
 *
 * @param {string} anolLayerswitcher If containing "open" layerswitcher initial state is expanded. Otherweise it is collapsed.
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Shows/hides background- and overlaylayer
 */
 // TODO handle add / remove layer
 // TODO handle edit layers title
.directive('anolLayerswitcher', ['LayersService', 'ControlsService', function(LayersService, ControlsService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        transclude: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/layerswitcher/templates/layerswitcher.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        scope: {
            anolLayerswitcher: '@anolLayerswitcher',
            tooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@'
        },
        compile: function(tElement, tAttrs) {
            var prepareAttr = function(attr, _default) {
                return attr === undefined ? _default : attr;
            };
            tAttrs.tooltipPlacement = prepareAttr(tAttrs.tooltipPlacement, 'left');
            tAttrs.tooltipDelay = prepareAttr(tAttrs.tooltipDelay, 500);
            tAttrs.tooltipEnable = prepareAttr(tAttrs.tooltipEnable, !ol.has.TOUCH);

            return {
                pre: function(scope, element, attrs, AnolMapController) {
                    scope.collapsed = false;
                    scope.showToggle = false;

                    scope.backgroundLayers = LayersService.backgroundLayers;
                    var overlayLayers = [];

                    angular.forEach(LayersService.overlayLayers, function(layer) {
                        if(layer.displayInLayerswitcher !== false) {
                            console.log(layer.name, layer.title);
                            overlayLayers.push(layer);
                        }
                    });
                    scope.overlayLayers = overlayLayers;
                    if(angular.isDefined(AnolMapController)) {
                        scope.collapsed = scope.anolLayerswitcher !== 'open';
                        scope.showToggle = true;
                        ControlsService.addControl(
                            new anol.control.Control({
                                element: element
                            })
                        );
                    }
                },
                post: function(scope, element, attrs) {
                    scope.backgroundLayer = LayersService.activeBackgroundLayer();
                    scope.$watch('backgroundLayer', function(newVal, oldVal) {
                        if(angular.isDefined(oldVal)) {
                            oldVal.setVisible(false);
                        }
                        if(angular.isDefined(newVal)) {
                            newVal.setVisible(true);
                        }
                    });
                }
            };
        },
        controller: function($scope, $element, $attrs) {
            $scope.isGroup = function(toTest) {
                var result = toTest instanceof anol.layer.Group;
                return result;
            };
        }
    };
}]);
