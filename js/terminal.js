/**
 * Holds all the modules for the terminal.
 *
 * To define a new module, add a new key:object to the list.
 * The key will be the program's calling name.
 * The object has the following properties:
 *     - name: String -> the name of the module. Often the same as the key.
 *     - category: String -> the category of the module. This is used for classification with `help`.
 *     - help: String -> a help text when `help <program>` is entered.
 *     - visible: Boolean -> whether or not the module is visible when `help` is entered.
 *     - run: Function -> the function that is called when the module is used.
 *                       the function is called with the user input and any prefixed options:
 *                       `program -i hello -o world` -> program.run('hello -o world', ['i'])
 */
const term_modules = {
    echo: {
        name: 'echo',
        category: 'general',
        help: 'display a line of text\nusage: echo STRING',
        visible: true,
        run: function(input) { return input; },
    },
    clear: {
        name: 'clear',
        category: 'general',
        help: 'clear the terminal',
        visible: true,
        run: function() { $('#terminal').html(''); },
    },
    help: {
        name: 'help',
        category: 'general',
        help: 'display program\'s help text\nusage: help [MODULE]',
        visible: true,
        run: function(input) {
            if (input === '') {
                var ls = {};
                Object.entries(term_modules).forEach(([_, mod]) => {
                    if (!mod.visible) {return;}
                    ls[mod.category] ? (ls[mod.category] += ' > ' + mod.name) : (ls[mod.category] = '> ' + mod.name);
                });

                var output = '';
                Object.entries(ls).forEach(([category, programs]) => {
                    output += '<b>' + category + '</b>\n' + programs + '\n';
                });

                return output.substr(0, output.length - 1);
            } else {
                var command = term_modules[input];
                return command ? command.help : 'Unknown module \'' + input + '\'.';
            }
        }
    },
    set: {
        name: 'set',
        category: 'general',
        help: 'change homepage settings\nusage: set SETTING [VALUE]\n' +
        'if no value is given, the setting will be deleted.\nexample: set terminal.name example',
        visible: true,
        run: function(input) {
            let vars = input.split(' ');

            switch (vars.length) {
                case 1:
                    window.settings.delete(vars[0]);
                    break;
                case 2:
                    window.settings.set(vars[0], vars[1]);
                    break;
                default:
                    let rest = vars.splice(1, vars.length).join(' ');
                    window.settings.set(vars[0], rest);
            }
        }
    },
    get: {
        name: 'get',
        category: 'general',
        help: 'get value of a setting\nusage: get [SETTING]\nexample: get terminal.name',
        visible: true,
        run: function(input) {
            if (input === '') {
                return window.settings;
            }
            try {
                let result = window.settings.get(input);
                if (result === undefined) {
                    return 'This setting does not exist / has no value';
                }
                return result;
            } catch(e) {
                return this.help();
            }
        }
    },
    history: {
        name: 'history',
        category: 'general',
        help: 'display (filtered) command history\nusage: history [-l LIMIT] [QUERY]',
        visible: true,
        run: function(input, options = []) {
            let limit = options.indexOf('l') > -1;
            let limit_n = 0;
            let history = modules.terminal.history.slice(0);
            
            if (limit) {
                try{
                    input = input.split(' ');
                    
                    limit_n = Number(input[0]);

                    input.shift();
                    input = input.join(' ');
                } catch (e) {
                    console.log(e);
                    return 'Invalid `limit` parameter; not a number.';
                }
            }

            if (input === '') {
                return history.slice(0 - limit_n).join('\n');
            }
            
            let results = $.grep(history, function(v) {
                return v.indexOf(input) > -1;
            });
            results = results.slice(0 - limit_n);
            return results.join('\n');
        }
    },
    keycode: {
        name: 'keycode',
        category: 'programs',
        help: 'return js keycodes for given string\nusage: keycode [-s SOURCE] [-n NUMPAD] INPUT',
        visible: true,
        keycodes: {
            '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53,
            '6': 54, '7': 55, '8': 56, '9': 57, 'a': 65, 'b': 66,
            'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72,
            'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78,
            'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84,
            'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
            ';': 186, '=': 187, ',': 188, '-': 189, '.': 190, '/': 191,
            '`': 192, '[': 219, '\\': 220, ']': 221, '\'': 222
        },
        numpad: {
            '0': 96, '1': 97, '2': 98, '3': 99, '4': 100, '5': 101,
            '6': 102, '7': 103, '8': 104, '9': 105
        },
        run: function(input, options = []) {
            if (input === '') {
                return this.help();
            }

            let source = options.indexOf('s') > -1;
            let numpad = options.indexOf('n') > -1;
        
            return this.which(input, source, numpad);
        },
        which: function(c, source = false, numpad = false) {
            let output = '';

            c = c.replace(/ /g, '').toLowerCase();    
            
            for (let i = 0; i < c.length; i++) {
                let x = this.keycodes[c[i]];

                if (numpad) {
                    x = this.numpad[c[i]] ? this.numpad[c[i]] : x;
                }

                if (source) {
                    output += c[i] + ':' + x + ' ';
                } else {
                    output += x + ' ';
                }
            }

            return output.trim();
        }
    },
    backup: {
        name: 'backup',
        category: 'general',
        help: 'make backup of localstorage\nusage: backup [-c COPY] [ITEM]\nexample: backup | backup settings',
        visible: true,
        run: function(item) {
            if (item !== '') {
                let x = JSON.parse(localStorage.getItem(item));

                if (x === null) {
                    return `Item '${item}' not found.`;
                }

                let response = {};
                response[item] = x;
                return JSON.stringify(response);
            }

            let keys = Object.keys(localStorage);
            let obj = {};

            keys.forEach((value) => {
                obj[value] = JSON.parse(localStorage.getItem(value));
            });

            return JSON.stringify(obj);
        }
    },
    restore: {
        name: 'restore',
        category: 'general',
        help: 'restore localstorage from json\nusage: restore DATA',
        visible: true,
        run: function(input) {
            let parsed = {};
            try {
                parsed = JSON.parse(input);
            } catch(e) {
                return 'Failed to parse JSON.';
            }

            Object.entries(parsed).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });

            modules.terminal.init();
        }
    },
    search: {
        name: 'search',
        category: 'programs',
        help: 'search the web for a string.\nusage: search [OPTION] QUERY',
        visible: true,
        se: {
            'y': "https://www.youtube.com/results?search_query=",
            'w': "https://en.wikipedia.org/w/index.php?search=",
            'd': "https://duckduckgo.com/?q=",
            'g': "https://www.google.com/search?q="
        },
        run: function(input, opts = ['g']) {
            if (input === '') {
                return this.searchEngineHelp();
            }
            let query = input.replace(" ", "+");
            this.se[opts[0]] ? window.location = this.se[opts[0]] + query : window.location = this.se['g'] + query;
        },
        searchEngineHelp: function() {
            let regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:(?:www|en)\.)?([^:\/\n.]+)/im;
            let output = this.help + '\npossible search options:\n'
            Object.entries(this.se).forEach(([key, val]) => {
                output += '  -' + key + ':' + regex.exec(val)[1] + '\n';
            });
            return output.substr(0, output.length - 1); // remove last \n
        }
    },
    bm: {
        name: 'bm',
        category: 'programs',
        help: 'navigate to a bookmark\nusage: bm NAME\n' + 
              'possible methods: set | remove | list\n' + 
              'enter `help bm method` to see help for a method.',
        visible: true,
        methods: ['set', 'remove', 'list'],
        run: function(input) {
            if (input === '') {
                return this.help;
            }
            let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
            let url = bookmarks[input];
            if (url) {
                window.location = url;
                return `Navigating to ${input}`;
            }
            return "Bookmark not found";
        }
    },
    "bm set": {
        name: 'bm set',
        category: 'programs',
        help: 'set a bookmark\nusage: bm set NAME LINK',
        visible: false,
        run: function(input) {
            let vars = input.split(' ');
            if (vars.length != 2) {
                return this.help;
            }
            let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
            bookmarks[vars[0]] = vars[1];
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        }
    },
    "bm remove": {
        name: 'bm remove',
        category: 'programs',
        help: 'remove a bookmark\nusage: bm remove NAME',
        visible: false,
        run: function(input) {
            if (input === '') {
                return this.help;
            }
            let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
            delete bookmarks[input];
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

            if (bookmarks[input]) {
                return `removed bookmark '${input}' (${bookmarks[input]})`;
            }
        }
    },
    "bm list": {
        name: 'bm list',
        category: 'programs',
        help: 'list all bookmarks\nusage: bm list',
        visible: false,
        run: function(input) {
            let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
            let output = '';
            Object.entries(bookmarks).forEach(([key, value]) => {
                output += `> <a href="${value}">${key}</a>`;
            });
            return output;
        }
    },
    chan: {
        name: 'chan',
        category: 'programs',
        help: 'navigate to (a) 4chan (board)\nusage: chan [BOARD]',
        visible: true,
        url: "http://4chan.org",
        run: function(input) {
            if (input === '') {
                window.location = this.url;
                return "Navigating to 4chan home";
            }

            if (!input.startsWith('/')) { input = "/" + input; }
            window.location = this.url + input;
            return `Navigating to 4chan ${input}`;
        }
    },
    reddit: {
        name: 'reddit',
        category: 'programs',
        help: 'navigate to (a) reddit (sub)\nusage: reddit [r/SUB | u/USER]',
        visible: true,
        url: 'https://reddit.com/',
        run: function(input) {
            if (input === '') {
                window.location = this.url;
            }

            if (input.startsWith('/')) { input = input.substring(1, input.legnth); }
            window.location = this.url + input;
            return `Navigating to reddit ${input}`;
        }
    },
    notify: {
        name: 'notify',
        category: 'general',
        help: 'show a notification\nusage: notify MESSAGE [;DURATION] [;ERROR]\n' + 
              'duration: integer in miliseconds | error: "true" | "false"\n' +
              'example: notify Hello World!;5000;true',
        visible: true,
        run: function(input) {
            console.log(input);
            let x = input.split(';');
            let msg = x[0];
            let duration = x[1] ? Number(x[1]) : 5000;
            let error = x[2] && x[2] == 'true';
            modules.notify.msg(msg, duration, error);
        }
    },
    weather: {
        name: 'weather',
        category: 'programs',
        help: 'get the weather, current or forecast\nusage: weather [-f]',
        visible: true,
        run: function(input, options = []) {
            if (options.indexOf('f') > -1) {
                return this.getForecast();
            }
            return this.getCurrent();
        },
        getCurrent: function() {
            let source = $('#weather-current-template').html();
            let template = Handlebars.compile(source);
            let html = template(modules.weather.weather.current);
            return html.trim();
        },
        getForecast: function() {
            let source = $('#weather-forecast-template').html();
            let template = Handlebars.compile(source);
            let html = template(modules.weather.weather.forecast);
            return html.trim();
        }
    },
    lastfm: {
        name: 'lastfm',
        category: 'programs',
        help: 'go to band or tag on last.fm\nusage: lastfm [-t] QUERY',
        visible: true,
        bandUrl: 'http://last.fm/music/',
        tagUrl: 'http://last.fm/tag/',
        run: function(input, options = []) {
            input = input.replace(' ', '+');
            if (options.indexOf('t') > -1) {
                return this.toTag(input);
            } else {
                return this.toBand(input);
            }
        },
        toBand: function(band) {
            window.location = `${this.bandUrl}${band}`;
            return `navigating to last.fm - ${band}`;
        },
        toTag: function(tag) {
            window.location = `${this.tagUrl}${tag}`;
            return `navigating to last.fm - ${tag}`;
        }
    }
};
