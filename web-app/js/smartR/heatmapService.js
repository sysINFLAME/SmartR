/**
 * Heatmap Service
 */

HeatmapService = (function(){

    var service = {};

    var _createAnalysisConstraints = function (params) {

        var _retval = {
            conceptKey : params.conceptPath,
            dataType: 'mrna',
            resultInstanceId: params.resultInstanceId,
            projection: 'zscore',
            label: '_TEST_LABEL_'
            //dataConstraints: {
            //    search_keyword_ids: {
            //        keyword_ids: [1837633]
            //    }
            //}
        };

        //if (params.identifier.length>1) {
        //   _retval.dataContstraints = {
        //        genes : {
        //            names : [params.identifiers]
        //        }
        //    };
        //}

        return  _retval;
    };

    /**
     * Create r-session id
     * @returns {*}
     */
    service.initialize = function () {

        // ajax call to session creation
        $j.ajax({
            url: pageInfo.basePath + '/RSession/create',
            type: 'POST',
            timeout: '600000',
            contentType: 'application/json',
            data : JSON.stringify( {
                workflow : 'heatmap'
            })
        }).done(function(response) {
            result = response;
            GLOBAL.HeimAnalyses = {
                type : 'heatmap',
                sessionId :response.sessionId
            };
            console.log(GLOBAL.HeimAnalyses);
            return GLOBAL.HeimAnalyses;
        }).fail(function() {
            // TODO: error displayed in a placeholder somewhere in main heim-analysis page
            console.error('Cannot create r-session');
            return null;
        });

    };

    /**
     * fetch data
     * @param eventObj
     */
    service.fetchData = function (params) {
        var _args = _createAnalysisConstraints(params);
        console.log('Analysis Constraints', _args);

        $j.ajax({
            type: 'POST',
            url: pageInfo.basePath + '/ScriptExecution/run',
            data: JSON.stringify({
                sessionId : GLOBAL.HeimAnalyses.sessionId,
                arguments : _args,
                taskType : 'fetchData',
                workflow : 'heatmap'
            }),
            contentType: 'application/json',
            complete: function(data) {
                var scriptExecObj = JSON.parse(data.responseText);
                GLOBAL.HeimAnalyses.executionId = scriptExecObj.executionId;
                console.log(GLOBAL.HeimAnalyses);
                //$j('#heim-fetch-data-output').html(data.responseText);
            }
        });
    };

    service.getIndentifierSuggestions = function (request, response) {
        jQuery.get("/transmart/search/loadSearchPathways", {
            query: request.term
        }, function (data) {
            data = data.substring(5, data.length - 1);  // loadSearchPathways returns String with null (JSON).
                                                        // This strips it off
            data = JSON.parse(data);// String rep of JSON to actual JSON
            data = data['rows'];// Response is encapsulated in rows
            var suggestions = [];
            for (var i = 0; i < data.length;i++){
                var geneName = data[i]['keyword']; //I assume we use keywords, not synonyms or IDs
                suggestions.push(geneName);
            }
            response(suggestions);
        });

    };

    service.checkStatus = function (eventObj) {
        $j.ajax({
            type : 'GET',
            url : pageInfo.basePath + '/ScriptExecution/status',
            data : {
                sessionId : GLOBAL.HeimAnalyses.sessionId,
                executionId : GLOBAL.HeimAnalyses.executionId
            }
        })
        .done(function (d) {
            console.log('I am done with checking status', d);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        })
        .always(function () {
            console.log('Finished!');
        });
    };

    service.getResultFiles = function (eventObj) {
        $j.ajax({
            type : 'GET',
            url : pageInfo.basePath + '/ScriptExecution/files',
            data: {
                sessionId : GLOBAL.HeimAnalyses.sessionId,
                executionId : GLOBAL.HeimAnalyses.executionId
            },
            contentType: 'application/json',
            complete: function(data) {
                console.log('data', data);
            }
        });
    };

    service.runAnalysis = function (eventObj) {

        $j.ajax({
            type: 'POST',
            url: pageInfo.basePath + '/ScriptExecution/run',
            data: JSON.stringify({
                sessionId : GLOBAL.HeimAnalyses.sessionId,
                arguments : {},
                taskType : 'run'}
            ),
            contentType: 'application/json',
            complete: function(data) {
                var scriptExecObj = JSON.parse(data.responseText);
                GLOBAL.HeimAnalyses.executionId = scriptExecObj.executionId;
                console.log(GLOBAL.HeimAnalyses);
            }
        });
    };

    return service;
})();