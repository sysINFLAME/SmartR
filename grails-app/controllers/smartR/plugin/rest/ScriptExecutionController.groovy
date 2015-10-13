package smartR.plugin.rest

class ScriptExecutionController {

    def RServeSessionService
    def sendFileService

    /**
     *
     *{
     *  'sessionId': '',
     *  'workflow': 'heatmap'
     * }
     */
    def init() {
        def json = request.JSON
        String scriptExecutionId = RServeSessionService.executeInitScript(json.sessionId, json.workflow)

        render(contentType: 'text/json') {
            [scriptExecutionId: scriptExecutionId]
        }
    }

    def run() {
        def json = request.JSON
        String scriptExecutionId = RServeSessionService.executeRunScript(json.sessionId, json.workflow)

        render(contentType: 'text/json') {
            [scriptExecutionId: scriptExecutionId]
        }
    }

    def status() {
        def status = RServeSessionService.getScriptExecutionStatus(params.sessionId, params.scriptExecutionId)

        render(contentType: 'text/json') {
            [status: status]
        }
    }

    def result() {
        def result = RServeSessionService.getScriptExecutionResult(params.sessionId, params.scriptExecutionId)

        render(contentType: 'text/json') {
            [result: result]
        }
    }

    /**
    * Returns a file by name. File must exists within given R session and for given execution ID.
    *{
    *  'sessionId': '',
     *  'executionId':'',
    *  'name': ''
    * }
    */
    def output(){
        def sessionId = params.JSON.sessionId
        def executionId = params.JSON.executionId
        def fileName = params.JSON.name

        def selectedFile = RServeSessionService.getScriptExecutionOutput(sessionId,executionId,fileName)
        if (!selectedFile) {
            render status: 404
            return
        }

        if (!selectedFile.isFile()) {
            render status: 404
            return
        }

        sendFileService.sendFile servletContext, request, response, selectedFile
    }
    /**
     * Lists files generated by the R script.
     *{
     *  'sessionId': '',
     *  'executionId':'',
     *
     * }
     */
    def files(){
        def sessionId = params.JSON.sessionId
        def executionId = params.JSON.executionId

        def result = RServeSessionService.getScriptExecutionFiles(sessionId,executionId)
        render(contentType: 'text/json') {
            [result: result]
        }
    }
}