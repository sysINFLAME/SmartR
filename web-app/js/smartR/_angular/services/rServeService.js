
smartRApp.factory('rServeService', ['$scope', function($scope) {

    var service = {};

    service.startSession = function() {
        // TODO
    };

    service.fetchData = function () {
        console.log('about to fetch data');
    };

    service.runWorkflow = function () {
        console.log('about to run workflow');
    };

    // etc.

    return service;
}]);