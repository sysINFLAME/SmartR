//# sourceURL=d3Linegraph.js

'use strict';

window.smartRApp.directive('lineGraph', [
    'smartRUtils',
    '$rootScope',
    function(smartRUtils, $rootScope) {

        return {
            restrict: 'E',
            scope: {
                data: '=',
                width: '@',
                height: '@'
            },
            templateUrl: $rootScope.smartRPath + '/js/smartR/_angular/templates/linegraph.html',
            link: function (scope, element) {
                var template_ctrl = element.children()[0],
                    template_viz = element.children()[1];

                scope.$watch('data', function() {
                    $(template_viz).empty();
                    if (! $.isEmptyObject(scope.data)) {
                        smartRUtils.prepareWindowSize(scope.width, scope.height);
                        createLinegraph(scope, template_viz, template_ctrl);
                    }
                });
            }
        };

        function createLinegraph(scope, vizDiv) {
            var MARGIN = {top: 50, right: 50, bottom: 50, left: 50};
            var LINEGRAPH_WIDTH = parseInt(scope.width) - MARGIN.left - MARGIN.right;
            var LINEGRAPH_HEIGHT = parseInt(scope.height) - MARGIN.top - MARGIN.bottom;

            var CAT_PLOTS_HEIGHT = LINEGRAPH_HEIGHT / 2; // FIXME: make dynamic
            var NUM_PLOTS_HEIGHT = LINEGRAPH_HEIGHT / 2; // FIXME: make dynamic
            var CAT_PLOTS_OFFSET_BOTTOM = 20;

            var data_matrix = scope.data.data_matrix;

            var cf = crossfilter(data_matrix);
            var byPatientID = cf.dimension(function(d) { return d.patientID; });
            var byValue = cf.dimension(function(d) { return d.value; });
            var byTimeInteger = cf.dimension(function(d) { return d.timeInteger; });
            var byBioMarker = cf.dimension(function(d) { return d.bioMarker; });
            var byType = cf.dimension(function(d) { return d.type; });
            var bySubset = cf.dimension(function(d) { return d.subset; });

            var groupBioMarker = byBioMarker.group();

            var patientRange = smartRUtils.getElementWithoutEventListeners('sr-linegraph-patient-range');
            patientRange.min = 0;
            patientRange.max = smartRUtils.unique(getValuesForDimension(byPatientID)).length;
            patientRange.value = 5;
            patientRange.step = 1;
            patientRange.addEventListener('change', function() {
                numOfPatientsToShow(patientRange.value);
                renderCategoricPlots();
            });

            function numOfPatientsToShow(num) {
                byPatientID.filterAll();
                var shownPatients = smartRUtils.unique(getValuesForDimension(byPatientID)).slice(0, num);
                byPatientID.filterFunction(function(patient) { return shownPatients.indexOf(patient) !== -1; });
            }
            numOfPatientsToShow(5);

            function getValuesForDimension(dimension) {
                return dimension.top(Infinity).map(function(record) { return dimension.accessor(record); });
            }

            var x = d3.scale.linear();
            // recomputes x scale for current filters
            function calculateXScale() {
                var times = smartRUtils.unique(getValuesForDimension(byTimeInteger)).sort();
                var xTicks = times.map(function(time) {
                    return (time - times[0]) / (times[times.length - 1] - times[0]) * LINEGRAPH_WIDTH;
                });
                x.domain(times).range(xTicks);
            }
            calculateXScale();

            byType.filterExact('categoric');
            var catBioMarkers = smartRUtils.unique(getValuesForDimension(byBioMarker));
            byType.filterExact('numeric');
            var numBioMarkers = smartRUtils.unique(getValuesForDimension(byBioMarker));
            byType.filterExact('highDimensional');
            var highBioMarkers = smartRUtils.unique(getValuesForDimension(byBioMarker));
            byType.filterAll();

            var svg = d3.select(vizDiv).append('svg')
                .attr('width', LINEGRAPH_WIDTH + MARGIN.left + MARGIN.right)
                .attr('height', LINEGRAPH_HEIGHT + MARGIN.top + MARGIN.bottom)
                .append('g')
                .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

            // temporary dimension because we don't want to affect the time filter
            var tmpByTimeInteger = cf.dimension(function(d) { return d.timeInteger; });
            var tickFormat = {};
            smartRUtils.unique(getValuesForDimension(byTimeInteger)).forEach(function(timeInteger) {
                tmpByTimeInteger.filterExact(timeInteger);
                tickFormat[timeInteger] = byTimeInteger.top(1)[0].timeString;
            });
            tmpByTimeInteger.dispose();
            var xAxis = d3.svg.axis()
                .scale(x)
                .tickFormat(function(d) { return tickFormat[d]; });

            svg.append('g')
                .attr('class', 'sr-linegraph-x-axis')
                .attr('transform', 'translate(' + 0 + ',' + LINEGRAPH_HEIGHT + ')')
                .call(xAxis);

            function iconGenerator() {
                var square = function(size) { return 'M0,0H' + size + 'V' + size + 'H0Z'; };
                var triangle = function(size) { return 'M' + (size / 2) + ',0L' + size + ',' + size + 'H0Z'; };
                var diamond = function(size) {
                    return 'M' + (size / 2) + ',0' +
                        'L' + size + ',' + (size / 2) +
                        'L' + (size / 2) + ',' + size +
                        'L0,' + (size / 2) + 'Z';
                };
                var revTriangle = function(size) { return 'M0,0H' + size + 'L' + (size / 2) + ',' + size + 'Z'; };
                var hexagon = function(size) { return 'M' + (size / 2) + ',0' +
                        'L' + size + ',' + size / 4 +
                        'L' + size + ',' + (size * 3 / 4) +
                        'L' + (size / 2) + ',' + size +
                        'L0,' + (size * 3 / 4) +
                        'L0,' + (size / 4) + 'Z';
                };
                var fallback = function(size) { return 'M0,0L' + size + ',' + size + 'M' + size + ',0L0,' + size; };
                var iconTable = [
                    //blue  orange  violet  red green
                    {shape: square},{shape: square},{shape: square},{shape: square},{shape: square}, // square
                    {shape: triangle},{shape: triangle},{shape: triangle},{shape: triangle},{shape: triangle}, // triangle
                    {shape: diamond},{shape: diamond},{shape: diamond},{shape: diamond},{shape: diamond}, // diamond
                    {shape: revTriangle},{shape: revTriangle},{shape: revTriangle},{shape: revTriangle},{shape: revTriangle}, // revTriangle
                    {shape: hexagon},{shape: hexagon},{shape: hexagon},{shape: hexagon},{shape: hexagon}, // hexagon
                    {shape: fallback} // fallback
                ];
                var cache = {};
                return function(bioMarker) {
                    var icon = cache[bioMarker];
                    if (typeof cache[bioMarker] === 'undefined') {
                        var itemsInCache = Object.keys(cache).length;
                        icon = iconTable[itemsInCache >= iconTable.length - 1 ?
                            iconTable[iconTable.length - 1] : itemsInCache];
                        cache[bioMarker] = icon;
                    }
                    // FIXME: for testing until we got real data
                    icon = iconTable[Math.floor(Math.random() * iconTable.length)];
                    return icon;
                };
            }
            var iconGen = iconGenerator();


            function renderNumericPlots() {
                byType.filterExact('numeric');
            }

            function renderCategoricPlots() {
                byType.filterExact('categoric');
                // temporary dimensions because we want to keep filters within this function scope
                var tmpByPatientID = cf.dimension(function(d) { return d.patientID; });
                var tmpByTimeInteger = cf.dimension(function(d) { return d.timeInteger; });

                var id = 0;
                var catPlotInfo = smartRUtils.unique(getValuesForDimension(byPatientID)).map(function(patientID) {
                    tmpByPatientID.filterExact(patientID);
                    var maxCount = 0;
                    var times = smartRUtils.unique(getValuesForDimension(byTimeInteger));
                    times.forEach(function(time) {
                        tmpByTimeInteger.filterExact(time);
                        var count = byValue.top(Infinity).length;
                        maxCount = count > maxCount ? count : maxCount;
                        // we need to disable this filter temporarily, otherwise it will affect the next iteration step
                        tmpByTimeInteger.filterAll();
                    });
                    return {id: id++, patientID: patientID, maxDensity: maxCount};
                });

                var totalDensity = catPlotInfo.reduce(function(prev, curr) { return curr.maxDensity + prev; }, 0);
                var iconSize = 1 / totalDensity * CAT_PLOTS_HEIGHT;
                catPlotInfo.forEach(function(d) {
                    d.height = d.maxDensity * iconSize;
                    tmpByPatientID.filterExact(d.patientID);
                    d.subset = smartRUtils.unique(getValuesForDimension(bySubset));
                });

                // we don't dispose them because we need them again and dimension creation is expensive
                tmpByTimeInteger.filterAll();
                tmpByPatientID.filterAll();

                // DATA JOIN
                var catPlot = svg.selectAll('.sr-linegraph-cat-plot')
                    .data(catPlotInfo, function(d) { return d.id; });

                // ENTER g
                var catPlotEnter = catPlot.enter()
                    .append('g')
                    .attr('class', function(d) {
                        return 'sr-linegraph-cat-plot' + ' ' + 'patientid-' + smartRUtils.makeSafeForCSS(d.patientID);
                    });
                // ENTER rec
                catPlotEnter.append('rect')
                    .attr('width', LINEGRAPH_WIDTH)
                    .attr('fill', function(d) {
                        if (d.subset.length === 2) { return 'rgba(255, 255, 0, 0.5)'; }
                        if (d.subset[0] === 1) { return 'rgba(0, 255, 0, 0.5)'; }
                        return 'rgba(255, 0, 0, 0.5)';
                    });

                // ENTER text
                catPlotEnter.append('text')
                    .text(function(d) { return d.patientID; })
                    .attr('dy', '0.35em');

                // UPDATE g
                catPlot.attr('transform', function(d, i) {
                    var previousHeight = 0;
                    for (var j = i - 1; j >= 0; j--) {
                        previousHeight += catPlotInfo[i].height;
                    }
                    var y = LINEGRAPH_HEIGHT - CAT_PLOTS_OFFSET_BOTTOM - previousHeight - d.height;
                    return 'translate(' + 0 + ',' + y + ')';
                });

                // UPDATE text
                catPlot.select('text')
                    .style('font-size', function(d) { return d.height + 'px'; })
                    .attr('x', 0)
                    .attr('y', function(d) { return d.height / 2; });

                // UPDATE rect
                catPlot.select('rect')
                    .attr('height', function(d) { return d.height; });

                // EXIT g
                catPlot.exit().remove();

                // start ENTER UPDATE EXIT cycle for each separate plot to render data points
                d3.selectAll('.sr-linegraph-cat-plot').each(function(d) {
                    tmpByPatientID.filterExact(d.patientID);
                    // a filtered & sorted list to determine the placement within a patient row
                    var bioMarkerToRender = groupBioMarker.all()
                        .filter(function(d) { return d.value > 0; })
                        .sort(function(a, b) {
                            var sortValue = a.value - b.value;
                            return sortValue === 0 ? a.key.localeCompare(b.key) : sortValue;
                        })
                        .map(function(d) { return d.key; });
                    // DATA JOIN
                    var icon = d3.select(this).selectAll('.sr-linegraph-cat-icon')
                        .data(byBioMarker.top(Infinity), function(d) { return d.id; });

                    // ENTER path
                    icon.enter()
                        .append('path')
                        .attr('class', function(d) {
                            return 'sr-linegraph-cat-icon' +
                                ' patientid-' + smartRUtils.makeSafeForCSS(d.patientID) +
                                ' time-' + smartRUtils.makeSafeForCSS(d.timeInteger) +
                                ' biomarker-' + smartRUtils.makeSafeForCSS(d.bioMarker) +
                                ' subset-' + d.subset;
                        });

                    // UPDATE path
                    icon
                        .attr('d', function(d) { return iconGen(d.bioMarker).shape(iconSize); })
                        .attr('transform', function(d) {
                            return 'translate(' + x(d.timeInteger) + ',' + 0 + ')';
                        });

                    // EXIT path
                });

                // drop temporary filters
                tmpByPatientID.dispose();
                tmpByTimeInteger.dispose();
                // reset other filters
                byType.filterAll();
            }
            renderCategoricPlots();
        }
    }
]);
