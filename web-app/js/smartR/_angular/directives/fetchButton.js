
smartRApp.directive('fetchButton', ['rServeService', 'smartRUtils', function(rServeService, smartRUtils) {
    return {
        restrict: 'E',
        scope: {
            conceptMap: '='
        },
        template: '<input type="button" value="Fetch Data"><span></span>',
        link: function(scope, element) {
            var template_btn = element.children()[0];
            var template_msg = element.children()[1];

            template_btn.onclick = function() {
                var conceptKeys = smartRUtils.conceptBoxMapToConceptKeys(scope.conceptMap);
                rServeService.loadDataIntoSession(conceptKeys).then(
                    function(msg) { template_msg.innerHTML = '  Success: ' + msg; },
                    function(msg) { template_msg.innerHTML = '  Failure: ' + msg; }
                );
            };
        }
    };
}]);