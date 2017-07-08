$(document).ready(function() {
    "use strict";

    registerHelperMethods();

    var waiting = {};

    // Load all modules.
    Object.entries(modules).forEach(([key, obj]) => {
        switch  (obj.runtime) {
            case 0: // run immediately
                obj.run();
                break;
            case 1: // run only when certain view is displayed (e.g. terminal).
                waiting[obj.view] = key;
                break;
            case 2: // do some initial setup, but only run when certain view is displayed. (e.g. todo).
                obj.init();
                waiting[obj.view] = key;
                break;
        }
    });

    // Used to check for called upon view. See the modules' `runtime` 1 | 2. ^
    $(window).on('viewchanged', (e) => {
        let x = waiting[e.view];

        if (x) {
            delete waiting[e.view];
            modules[x].run();
        }
    });

    // Make sure textareas automatically resize when typing.
    $(document).on('input', 'textarea', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

});

function registerHelperMethods() {
    // Could also use prototype?
    Object.set = function set(obj, path, value) {
        let pList = path.split('.');
        let len = pList.length;
        
        for(let i = 0; i < len-1; i++) {
            let elem = pList[i];
            if (!obj[elem]) obj[elem] = {};
            obj = obj[elem];
        }

        obj[pList[len-1]] = value;
    };

    Object.get = function(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        
        let a = s.split('.');
        
        for (let i = 0, n = a.length; i < n; ++i) {
            let k = a[i];
            
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }

        return o;
    };

    Object.delete = function(obj, path) {
        console.log(obj);
        path = path.replace(/\[(\w+)\]/g, '.$1');
        path = path.replace(/^\./, '');
        let n = path.split('.');

        let curr = obj;
        for (let i = 0; i < n.length - 1; i++) {
            if (curr !== undefined) {
                curr = curr[n[i]] ? curr[n[i]] : undefined;
            }
        }

        if (curr !== undefined) {
            delete curr[n[n.length - 1]];
        }

        return obj;
    };

    Handlebars.registerHelper('decimal', function(number) {
        return parseFloat(Math.round(number * 100) / 100).toFixed(2);
    });

    Handlebars.registerHelper('unixdate', function(unix) {
        let date = new Date(unix * 1000);
        return `${date.getDate()} ${modules.clock.monthNames[date.getMonth()]}`;
    });

    Handlebars.registerHelper('kmh', function(ms) {
        return ms * 3.6;
    });
}
