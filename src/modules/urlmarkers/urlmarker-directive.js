import './module.js';
import Overlay from 'ol/Overlay';
import { getCenter } from 'ol/extent';

angular.module('anol.urlmarkers')

    .directive('anolUrlMarkers', ['$compile', 'UrlMarkerService', 'MapService', function($compile, UrlMarkerService, MapService) {
        return function(scope) {
            if(!UrlMarkerService.usePopup) {
                return;
            }

            var overlays = [];

            var popupTemplate = '<div class="anol-popup bottom">' +
                            '<span class="anol-popup-closer glyphicon glyphicon-remove" ng-mousedown="$event.stopPropagation();"></span>' +
                            '<div class="anol-popup-content" bbcode>' +
                            '</div>' +
                            '</div>';

            scope.$watchCollection(() => UrlMarkerService.getFeatures(), function () {
                for (const feature of UrlMarkerService.getFeatures()) {
                    if (feature.get('label')) {
                        var overlayTemplate = angular.element(angular.copy(popupTemplate));
                        overlayTemplate.find('.anol-popup-content').text(feature.get('label'));
                        var overlayElement = $compile(overlayTemplate)(scope);
                        var overlay = new Overlay({
                            element: overlayElement[0],
                            autoPan: false
                        });
                        overlayElement.find('.anol-popup-closer').click(function() {
                            MapService.getMap().removeOverlay(overlay);
                        });
                        angular.element(overlay.getElement()).parent().addClass('anol-popup-container');
                        MapService.getMap().addOverlay(overlay);

                        overlay.setPosition(getCenter(feature.getGeometry().getExtent()));
                        overlays.push(overlay);
                    }
                }
            });
        };
    }]);
