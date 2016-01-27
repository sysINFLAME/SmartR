//# sourceURL=boxplotView.js

"use strict";

window.smartR.boxplotView = function(controller,
                                     model,
                                     conceptFactory,
                                     conceptBoxCollectionFactory) {

    var view = {};

    view.container = $('#heim-tabs');

    var conceptBox1 = conceptFactory('concept1', 'sr-concept1-btn');
    var conceptBox2 = conceptFactory('concept2', 'sr-concept2-btn');
    var subsets1    = conceptFactory('subsets1', 'sr-subset1-btn');
    var subsets2    = conceptFactory('subsets2', 'sr-subset2-btn');

    var conceptBoxCollection = conceptBoxCollectionFactory({
        box1: conceptBox1,
        box2: conceptBox2,
        groups1: subsets1,
        groups2: subsets2,
    });

    view.fetchBoxplotBtn = $('#sr-btn-fetch-boxplot');
    view.runBoxplotBtn = $('#sr-btn-run-boxplot');

    view.init = function() {
        // init controller
        controller.init();

        //init tab
        view.container.tabs();

        // bind ui
        bindUIActions();
    };

    function bindUIActions() {
        view.runBoxplotBtn.on('click', function() {
            view.controller.run();
        });

        view.fetchBoxplotBtn.on('click', function() {
            var promise = window.smartR.util.getSubsetIds().pipe(function(subsets) {
                return controller.fetch(conceptBoxCollection.getAllConcepts(), subsets);
            });

            promise.done(function(data) {
                window.alert(JSON.stringify(data));
            });
        });
    }

    return view;
};
