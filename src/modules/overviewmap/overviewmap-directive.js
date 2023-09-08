import './module.js';
import OverviewMap from 'ol/control/OverviewMap';
import { TOUCH as hasTouch } from 'ol/has';
import View from 'ol/View';

angular.module('anol.overviewmap')
/**
 * @ngdoc directive
 * @name anol.overviewmap.directive:anolOverviewMap
 *
 * @requires $compile
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 * @requries anol.map.MapService
 *
 * @param {boolean} anolOverviewMap Wheather start collapsed or not. Default true.
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 *
 * @description
 * Adds a overview map
 */
    .directive('anolOverviewMap', ['$compile', 'ControlsService', 'LayersService', 'MapService', function($compile, ControlsService, LayersService, MapService) {
        return {
            restrict: 'A',
            scope: {
                collapsed: '@anolOverviewMap',
                tooltipPlacement: '@',
                tooltipDelay: '@'
            },
            link: function(scope) {
                scope.collapsed = scope.collapsed !== false;
                var backgroundLayers = [];
                angular.forEach(LayersService.backgroundLayers, function(layer) {
                    backgroundLayers.push(layer.olLayer);
                });
                // TODO use when resolved
                // https://github.com/openlayers/ol3/issues/3753
                var olControl = new OverviewMap({
                    layers: backgroundLayers,
                    label: document.createTextNode(''),
                    collapseLabel: document.createTextNode(''),
                    collapsed: scope.collapsed,
                    view: new View({
                        maxZoom: 11,
                        minZoom: 9,
                        zoom: 10
                    })
                });
                var control = new anol.control.Control({
                    olControl: olControl
                });

                // disable nativ tooltip
                var overviewmapButton = angular.element(olControl.element).find('button');
                overviewmapButton.removeAttr('title');
                // add cool tooltip
                overviewmapButton.attr('uib-tooltip', '{{ \'anol.overviewmap.TOOLTIP\' | translate }}');
                overviewmapButton.attr('tooltip-placement', scope.tooltipPlacement || 'right');
                overviewmapButton.attr('tooltip-append-to-body', true);
                overviewmapButton.attr('tooltip-popup-delay', scope.tooltipDelay || 500);
                overviewmapButton.attr('tooltip-enable', angular.isUndefined(scope.tooltipEnable) ? !hasTouch : scope.tooltipEnable);
                overviewmapButton.attr('tooltip-trigger', 'mouseenter');
                // add icon
                // cannot use ng-class, because icon change comes to late after click
                overviewmapButton.attr('ng-click', 'updateIcon()');
                var overviewmapButtonIcon = angular.element('<span class="glyphicon glyphicon-chevron-' + (scope.collapsed ? 'right' : 'left') + '"></span>');
                overviewmapButton.append(overviewmapButtonIcon);

                $compile(overviewmapButton)(scope);
                ControlsService.addControl(control);

                scope.updateIcon = function() {
                    var collapsed = olControl.getCollapsed();
                    overviewmapButtonIcon.removeClass('glyphicon-chevron-' + (collapsed ? 'left' : 'right'));
                    overviewmapButtonIcon.addClass('glyphicon-chevron-' + (collapsed ? 'right' : 'left'));
                };
            }
        };
    }]);
