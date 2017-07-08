const SHORTCUTS = [
    {
        key: [82, 50], // 'r', '2'
        ctrl: false,
        allowedTags: [],
        func: function() {
            $('#nav-reddit').click();
        }
    },
    {
        key: [79, 49], // 'o', '1'
        ctrl: false,
        allowedTags: [],
        func: function() {
            $('#nav-other').click();
        }
    },
    {
        key: [84, 51], // 't', '3'
        ctrl: false,
        allowedTags: [],
        func: function() {
            $('#nav-todo').click();
        }
    },
    {
        key: [192], // '`' (tilde)
        ctrl: false,
        allowedTags: ['pre'],
        func: function() {
            $('#terminal-container').slideToggle({queue: false});
            
            if ($('#terminal').is(':visible')) {
                var e = $.Event('viewchanged');
                e.view = 'terminal';
                $(window).trigger(e);
                $('#input').focus();
            }
        }
    },
    {
        key: [27], // ESC
        ctrl: false,
        allowedTags: [],
        func: function() {
            $(document.activeElement).blur();
            $('#todo-datepicker').fadeOut(400);
        }
    },
    {
        key: [81], // Q
        ctrl: false,
        allowedTags: [],
        func: function() {
            $('#additional-other').slideToggle();
        }
    }
];

/**
 * All modules are loaded when the page is loaded.
 *
 * Modules define the following attributes:
 *     - name: String. Name of the module.
 *     - runtime: Number. The runtime attr determines when the module is loaded.
 *     - view: String. The id of the view on which to run. See runtime = 1 or 2.
 *     - run: Function. The function called when loading the module.
 * @type {Object}
 */
const modules = {
    viewHandler: {
        name: 'viewHandler',
        runtime: 0,
        run: function() {
            this.currentTab = $('#item-other');

            $(document).on('click', '.nav-item', (e) => {
                let newTab = $('#' + $(e.target).data('id') );
                this.switchTabs(newTab);
            });
        },
        switchTabs: function(newTab) {
            this.currentTab.hide();
            newTab.show();
            this.onViewChange(this.currentTab, newTab);
            this.currentTab = newTab;
        },
        onViewChange: function(oldView, newView) {
            let e = $.Event('viewchanged');
            e.oldView = oldView.attr('id');
            e.view = newView.attr('id');
            $(window).trigger(e);
        }
    },
    globalSettings: {
        name: 'globalsettings',
        runtime: 0,
        run: function() {
            window.settings = JSON.parse(localStorage.getItem('settings')) || {};
            window.settings.save = this.save;
            window.settings.set = this.set;
            window.settings.get = this.get;
            window.settings.delete = this.delete;
        },
        save: function() {
            localStorage.setItem('settings', JSON.stringify(window.settings));
        },
        set: function(item, value) {
            let oldValue = this.get(item);
            Object.set(window.settings, item, value);
            window.settings.save();
            
            modules.globalSettings.changed(item, oldValue, value);
        },
        get: function(item) {
            return Object.get(window.settings, item);
        },
        delete: function(item) {
            let oldValue = this.get(item);
            
            Object.delete(window.settings, item);
            window.settings.save();

            modules.globalSettings.changed(item, oldValue, null);
        },
        changed: function(setting, oldValue, newValue) {
            let event = $.Event('settingschanged');
            event.setting = setting;
            event.oldValue = oldValue;
            event.newValue = newValue;
            $(window).trigger(event);
        }
    },
    shortcut: {
        name: 'shortcut',
        runtime: 0,
        run: function() {
            $(document).keydown(function(e) {
                var tag = e.target.tagName.toLowerCase();
                var disallowedTags = ['input', 'textarea', 'pre'];

                var shortcut = $.grep(SHORTCUTS, function(v) {
                    return v.key.indexOf(e.which) > -1;
                })[0];

                if (shortcut && shortcut.ctrl === e.ctrlKey && 
                        (disallowedTags.indexOf(tag) == -1 ||
                        shortcut.allowedTags.indexOf(tag) > -1)) {
                    e.preventDefault();
                    shortcut.func();
                } else if (shortcut && shortcut.key == 27) {
                    shortcut.func();
                }
            });
        },
        trigger: function(keycode, ctrlKey = false) {
            var event = $.Event('keydown');
            event.which = keycode;
            event.target = document.querySelector('body');
            event.ctrlKey = ctrlKey;
            $(document).trigger(event);
        }
    },
    clock: {
        name: 'clock',
        runtime: 0,
        monthNames: [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ],
        run: function() {
            this.startClock();
            let self = this;
            setInterval(function() { self.startClock(); }, 5000);
        },
        startClock: function() {
            let today = new Date();

            let h = today.getHours();
            let m = today.getMinutes();
            // var s = today.getSeconds();

            m = this.checkZeroPadding(m);
            // s = checkTime(s);

            $('#time').html(h + ":" + m );//+ ":" + s);
            $('#date').html(this.formatDate(today));
        },
        checkZeroPadding: function(i) {
            if (i < 10) {i = "0" + i;}
            return i;
        },
        formatDate: function(date) {
            let day = date.getDate();
            let monthIndex = date.getMonth();
            let year = date.getFullYear();

            return day + ' ' + this.monthNames[monthIndex] + ' ' + year;
        },
    },
    notify: {
        name: 'notify',
        runtime: 0,
        active: 0,
        idPrefix: 'notif-',
        run: function() { return; },
        remove: function(id) {
            $("#" + this.idPrefix + id).remove();
            this.active--;
        },
        msg: function(message, duration = 5000, error = false) {
            let id = ++this.active;
            
            let source = $("#notification-template").html();
            let template = Handlebars.compile(source);
            let html = template({
                id: this.idPrefix + id,
                error: error, msg: message
            });

            $("#notifications").append(html);

            setTimeout(() =>{
                this.remove(id);
            }, duration);
        }
    },
    style: {
        name: 'style',
        runtime: 0,
        run: function() {
            $(window).on('settingschanged', (e) => {
                if (e.setting.startsWith('css')) {
                    this.reload();
                }
            });
            this.build();
        },
        build: function() {
            let x = window.settings.css || {};
            Object.values(x).map(e => {
                this.add(e);
            });
        },
        add: function(rule) {
            $('#custom_rules').append(rule);
        },
        reload: function() {
            $('#custom_rules').html('');
            this.build();
        }
    },
    todo: {
        name: 'todo',
        runtime: 2,
        view: 'item-todo',
        init: function() {
            this.ls = JSON.parse(localStorage.getItem('todo')) || [];
            this.ls.forEach((obj, index) => {
                if (obj.due && new Date(obj.due) < Date.now()) {
                    let msg = obj.task && obj.task.length > 50 ? obj.task.substring(0, 50) + "..." : obj.task;
                    modules.notify.msg(`Todo item #${index + 1} due: ${msg}`);
                }
            });
        },
        run: function() {
            this.sort();

            let source = $('#todo-single-template').html();
            let template = Handlebars.compile(source);

            $.each(this.ls, function(index, value) {
                value.index = index + 1;
                var html = template(value);
                $('#item-todo').append(html);
            });

            this.registerHandlers();
        },
        registerHandlers: function() {
            let clazz = this;

            // Enter pressed in `todo` tab input, save as new note.
            $('#todo-input').on('keyup', (e) => {
                if (e.keyCode == 13) {
                    var text = $('#todo-input').val();
                    this.add(text);
                    $('#todo-input').val('');
                }
            });

            // Note text clicked, make edit and savable.
            $(document).on('click', '.todo-editable', function(e) {
                function editHandler(e) {
                    if (e.type == 'focusout') {
                        let text = $(this).val();
                        let id = $(this).closest('div').attr('data-todo-id');
                        
                        clazz.edit(id, text);

                        let p = $("<p></p>", {text: text, class: "todo-editable"});
                        $(this).replaceWith(p);
                    }
                }

                let input = $("<textarea>", { 
                    val: $(this).text(),
                    rows: $(this).text().split('\n').length,
                    //keyup: editHandler,
                    focusout: editHandler
                });
                
                $(this).replaceWith(input);
                input.select();
            });

            // Date picker.
            $('#todo-datepicker .list li').click(e => {
                let id = $('#todo-datepicker').attr('data-id');
                let index = this.ls.findIndex(x => x.id == id);

                $('#todo-datepicker').fadeOut(400);

                let value = Number($(e.target).attr('data-value'));
                switch (value) {
                    case 0: // none -- clear due date.
                        delete this.ls[index].due;
                        break;
                    case 1: // 4 hours
                        this.ls[index].due = new Date(Date.now() + 1000 * 60 * 60 * 4);
                        break;
                    case 2: // 10 hours
                        this.ls[index].due = new Date(Date.now() + (1000 * 60 * 60 * 10));
                        break;
                    case 3: // 1 day
                        this.ls[index].due = new Date(Date.now() + (1000 * 60 * 60 * 24));
                        break;
                    case 4: // 3 days
                        this.ls[index].due = new Date(Date.now() + (1000 * 60 * 60 * 24 * 3));
                        break;
                    case 5: // 1 week
                        this.ls[index].due = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
                        break;
                    default:
                        modules.notify.msg('Something went wrong, no date set', 5000, true)
                }

                this.ls[index].updated = new Date();
                this.save();
            });

            $('#todo-datepicker').mouseleave(function() {
                $('#todo-datepicker').fadeOut(400);
            });
        },
        add: function(description) {
            let last = this.ls[this.ls.length - 1];
            let task = {
                id: last ? last.id + 1 : 1,
                task: description,
                done: false,
                created: new Date(),
            };

            this.ls.push(task);
            this.save();
            task.index = $('.todo-list-item').length + 1;

            let source = $('#todo-single-template').html();
            let template = Handlebars.compile(source);
            let html = template(task);
            $('#item-todo').append(html);
        },
        remove: function(id) {
            this.ls = this.ls.filter(function(obj) {
                return obj.id != id;
            });
            this.save();

            $('div').find('[data-todo-id="' + id + '"]').remove();
            this.fixIndexNumbers();
        },
        edit: function(id, text) {
            let index = this.ls.findIndex(x => x.id == id);
            this.ls[index].task = text;
            this.ls[index].updated = new Date();
            this.save();
        },
        toggleDone: function(id) {
            // Get index of todo list item with `id` in the todo list.
            let index = this.ls.findIndex(x => x.id == id);

            this.ls[index].done = !this.ls[index].done;
            this.ls[index].updated = new Date();
            this.save();

            let div = $('div').find("[data-todo-id='" + id + "']");
            let p = div.children('p');
            this.ls[index].done ? p.addClass('done') : p.removeClass('done');
        },
        formatDueDateTime: function(date) {
            let now = new Date();
            let delta = Math.abs(date - now) / 1000;
            
            let days = Math.floor(delta / 86400);
            delta -= days * 86400;

            let hours = Math.floor(delta / 3600) % 24;
            delta -= hours * 3600;

            let minutes = Math.floor(delta / 60) % 60;
            
            return `Due in ${days} days, ${hours} hours, ${minutes} minutes`;
        },
        showDatePicker: function(btn, id) {
            let offset = btn.offset();
            let index = this.ls.findIndex(x => x.id == id);

            $('#todo-current-due').html('');
            if (this.ls[index].due) {
                let date = new Date(this.ls[index].due);
                $('#todo-current-due').html(this.formatDueDateTime(date));
            }

            $('#todo-datepicker').attr('data-id', id);
            
            $('#todo-datepicker').fadeIn().css({
                left: Math.min(offset.left, $(window).innerWidth()-$('#todo-datepicker').outerWidth()) + 29,
                top: (offset.top + btn.innerHeight()) - 40,
            });
        },
        sort() {
            this.ls = this.ls.sort(function(a, b) { return (a > b) ? 1 : ((b > a) ? -1 : 0); });
        },
        save() {
            localStorage.setItem('todo', JSON.stringify(this.ls));
        },
        fixIndexNumbers: function() {
            $('.todo-list-item').each((index, obj) => {
                $(obj).attr('data-todo-index', index + 1);
            });
        }
    },
    weather: {
        name: 'weather',
        runtime: 0,
        apiKey: '', // open weather map API key
        mainCity: '',  // open weather map city id. Example: amsterdam = 2759794
        apiUrl: 'http://api.openweathermap.org/data/2.5/',
        run: function() {
            this.weather = JSON.parse(localStorage.getItem('weather')) || {};
            let chk_forecast = this.weather.chk_forecast ? new Date(this.weather.chk_forecast) : null;
            let chk_current = this.weather.chk_current ? new Date(this.weather.chk_current) : null;
            let now = new Date();

            if (!chk_current || (now - chk_current) > (1000 * 60 * 30)) {
                this.getCurrent();
            }
            if (!chk_forecast || (now - chk_forecast) > (1000 * 60 * 60)) {
                this.getForecast();
            }

            // Automatically refetch on city change.
            $(window).on('settingschanged', (e) => {
                if (e.setting === 'city') {
                    this.getCurrent();
                    this.getForecast();
                }
            });
        },
        getUrl: function(method) {
            let options = {appid: this.apiKey, units: 'metric', id: window.settings.city || this.mainCity};
            return this.apiUrl + method + "?" + 
                        Object.entries(options)
                              .map(elem => { return elem[0] + "=" + elem[1]; })
                              .join('&');
        },
        getCurrent: function() {
            $.ajax(this.getUrl('weather'))
            .done(data => {
                data.wind.direction = this.getWindDirection(data.wind.deg);
                this.weather.current = data;
                this.weather.chk_current = new Date();
                localStorage.setItem('weather', JSON.stringify(this.weather));
            })
            .catch(err => {
                console.error(err);
            });
        },
        getForecast: function() {
            $.ajax(this.getUrl('forecast'))
            .done(data => {
                let tomorrow = new Date().getDate() + 1;
                let days = {};

                data.list.forEach(item => {
                    let date = new Date(item.dt * 1000) 
                    let day = date.getDate();
                    if (day >= tomorrow && day <= (tomorrow + 2)) {
                        let clouds = item.clouds.all,
                            humidity = item.main.humidity,
                            temp = item.main.temp,
                            temp_min = item.main.temp_min,
                            temp_max = item.main.temp_max,
                            wind = item.wind.speed,
                            direction = item.wind.deg,
                            category = item.weather[0].main;
                        if (days[day]) {
                            days[day].clouds += clouds;
                            days[day].humidity += humidity;
                            days[day].temp += temp;
                            days[day].temp_min = days[day].temp_min < temp_min ? days[day].temp_min : temp_min;
                            days[day].temp_max = days[day].temp_max > temp_max ? days[day].temp_max : temp_max;
                            days[day].wind += wind;
                            days[day].direction += direction;
                            days[day].category.add(category);
                            days[day].nr += 1;
                        } else {
                            days[day] = {
                                clouds: clouds,
                                humidity: humidity,
                                temp: temp,
                                temp_min: temp_min,
                                temp_max: temp_max,
                                wind: wind,
                                direction: direction,
                                category: new Set([category]),
                                nr: 1,
                                date: day + " " + modules.clock.monthNames[date.getMonth()]
                            };
                        }
                    }
                });

                let avg = ['clouds', 'humidity', 'temp', 'wind', 'direction']

                for (let day in days) {
                    for (let val in days[day]) {
                        if (avg.indexOf(val) > -1) {
                            days[day][val] = days[day][val] / days[day].nr; 
                        } else if (val === 'category') {
                            days[day][val] = Array.from(days[day][val]).map(val => { return val.toLowerCase(); }).join(', ');
                        }
                    }
                    days[day].direction = this.getWindDirection(days[day].direction);
                }

                let forecast = Object.values(days);

                this.weather.forecast = {name: data.city.name, forecast: forecast};
                this.weather.chk_forecast = new Date();
                localStorage.setItem('weather', JSON.stringify(this.weather));
            })
            .catch(err => {
                console.error(err);
            });
        },
        getWindDirection: function(degrees) {
            switch (true) {
                case degrees > 348.75 || degrees <= 11.25:
                    return 'north';
                case degrees > 11.25 && degrees <= 33.75:
                    return 'north north east';
                case degrees > 33.75 && degrees <= 56.25:
                    return 'north east';
                case degrees > 56.25 && degrees <= 78.75:
                    return 'east north east';
                case degrees > 78.75 && degrees <= 101.25:
                    return 'east';
                case degrees > 101.25 && degrees <= 123.75:
                    return 'east south east';
                case degrees > 123.75 && degrees <= 146.25:
                    return 'south east';
                case degrees > 146.25 && degrees <= 168.75:
                    return 'south south east';
                case degrees > 168.75 && degrees <= 191.25:
                    return 'south';
                case degrees > 191.25 && degrees <= 213.75:
                    return 'south south west';
                case degrees > 213.75 && degrees <= 236.25:
                    return 'south west';
                case degrees > 236.25 && degrees <= 258.75:
                    return 'west south west';
                case degrees > 258.75 && degrees <= 281.25:
                    return 'west';
                case degrees > 281.25 && degrees <= 303.75:
                    return 'west north west';
                case degrees > 303.75 && degrees <= 326.25:
                    return 'north west';
                case degrees > 326.25 && degrees <= 348.75:
                    return 'north north west';
            }
        }
    },
    /*ethereum: {
        name: 'ethereum',
        runtime: 0,
        apiUrl: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=ETH,EUR',
        run: function() {
            if (window.settings.ethereum && window.settings.ethereum == 'false') {
                return;
            }
            this.price = JSON.parse(localStorage.getItem('ethereum')) || {};
            let last_checked = this.price.last_checked ? new Date(this.price.last_checked) : null;

            // If no previous records available, or it's been half an hour since last check, check again.
            if (!last_checked || (new Date() - last_checked) > (1000 * 60 * 30)) {
                this.checkPrice();
            }
        },
        checkPrice: function() {
            console.log("checkPrice called");
            $.ajax(this.apiUrl)
            .done(data => {
                let previous = jQuery.extend(true, {}, this.price);
                let diff = 0;
                this.price = data;
                this.price.last_checked = new Date();

                if (!jQuery.isEmptyObject(previous)) {
                    diff = ((100 / previous.EUR) * this.price.EUR) - 100;
                }

                diff = parseFloat(Math.round(diff * 100) / 100).toFixed(2);
                
                // assume no change (diff == 0)
                let growth = `<i class="fa fa-minus" aria-hidden="true"></i><span style="padding-left:5px;">${diff}</span>`;

                if (diff < 0) {
                    growth = `<i class="fa fa-caret-down red" aria-hidden="true"></i><span style="padding-left:5px;">${diff}</span>`;
                } else if (diff > 0) {
                    growth = `<i class="fa fa-caret-up green" aria-hidden="true"></i><span style="padding-left:5px;">${diff}</span>`;
                }

                localStorage.setItem('ethereum', JSON.stringify(this.price));

                let msg = `Ethereum price: €${this.price.EUR} <span style="padding-left:10px;">${growth}</span>`;
                modules.notify.msg(msg);
            })
            .catch(err => {
                modules.notify.msg('Failed to fetch ethereum data', 4000, true);
            });
        }
    },*/
    terminal: {
        name: 'terminal',
        runtime: 1,
        view: 'terminal',
        matches: [],
        historyPos: -1,
        run: function() {
            this.init();
            this.registerHandlers();
            this.showPrompt();
        },
        init: function() {
            this.history = JSON.parse(localStorage.getItem('history')) || [];
            this.historyPos = -1;
        },
        getName: function() {
            return window.settings.get('terminal.name') || 'guest'
        },
        getMachine: function() {
            return window.settings.get('terminal.machine') || 'guest';
        },
        showPrompt: function() {
            let prefix = this.getName() + "@" + this.getMachine() + " $ ";
            $('#terminal').append(
                '<pre id="prompt" class="prompt">' + prefix + '</pre>' +
                '<pre id="input" class="term-input" contenteditable="true" autofocus="true" spellcheck="false"></pre><br/>');

            $('#input').focus();
        },
        execute: function(raw_string) {
            raw_string = raw_string.trim();
            $('#input').remove();
            let oldText = $('#prompt').text();
            $("#prompt").replaceWith('<pre class="prompt old-input">' + oldText + raw_string + '</pre>');

            if (raw_string.length === 0) {
                this.output('');
                return;
            }

            let sliced = raw_string.split(' ');
            let command = sliced.shift();
            let mod = term_modules[command];

            if (!mod) {
                this.output('Command \'' + command + '\' not found. Type \'help\' for available commands.');   
                return;
            }

            if (mod.methods && mod.methods.indexOf(sliced[0]) > -1) {
                command += " " + sliced.shift();
                mod = term_modules[command];
            }

            let options = [];
            let input = '';
            for (let i = 0; i < sliced.length; i++) {
                if (sliced[i].startsWith('-')) {
                    let option = sliced[i].substr(1).split('');
                    options += option;
                } else {
                    input = sliced.splice(i, sliced.length).join(' ');
                    break;
                }
            }

            let output = '';
            try {
                output = mod.run(input, options);

                if (typeof output == 'undefined') {
                    this.showPrompt();
                } else {
                    this.output(output);
                }
            } catch(e) {
                console.error(e);
                output = 'Something went wrong while executing the command: "' + e.message + '"';
                this.output(output);
            }

            this.updateHistory(raw_string, command);
        },
        tabComplete: function() {
            let text = $('#input').text();
            let words = text.split(' ');
            
            if (this.matches.length > 1) {
                this.tabNext();
            } else if (term_modules[words[0]]) {
                this.tabCompleteHistory(text);
            } else {
                this.tabCompleteCommands(text);
            }
        },
        tabCompleteHistory: function(text) {
            this.matches = this.history.filter(function(entry) {
                return entry.startsWith(text);
            });

            if (this.matches.length > 1) {
                this.matches = this.matches.slice(0, 10);
            }

            this.tabCompleteMatches();
        },
        tabCompleteCommands: function(text) {
            for (let mod in term_modules) {
                if (term_modules[mod].name.startsWith(text)) {
                    this.matches.push(term_modules[mod].name);
                }
            }

            this.tabCompleteMatches();
        },
        tabCompleteMatches: function() {
            if (this.matches.length === 1) {
                $('#input').text(this.matches[0] + " ");
                
                this.focus();
                this.matches = [];
            } else if (this.matches.length > 1) {
                var source = $('#terminal-ac-template').html();
                var template = Handlebars.compile(source);
                var html = template({matches: this.matches});
                $('#terminal').append(html);
            }
        },
        tabNext: function() {
            var current = $('#term-ac span.selected');
            current.removeClass('selected');
            if (current.next().length) {
                current.next().addClass('selected');
            } else {
                $('#term-ac span').first().addClass('selected');
            }
            
            this.focus();
        },
        tabSelect: function() {
            var text = $('#term-ac span.selected').text();
            $('#input').text(text + " ");
            $('#term-ac').remove();
 
            this.focus();
            this.matches = [];
        },
        focus: function() {
            $('#input').focus();
            this.caretAtEnd();
        },
        registerHandlers: function() {
            $('#terminal').keydown((e) => {
                if (e.which === 9) {
                    e.preventDefault();
                    this.tabComplete();
                }
            });

            $(document).on('keypress', '#input', (e) => {
                if (e.which == 13) {
                    e.preventDefault();
                    if (this.matches.length > 0) {
                        this.tabSelect();
                    } else {
                        this.execute($('#input').text());
                    }
                }
                // Input has changed, remove any active autocomplete
                $('#term-ac').remove();
                this.matches = [];
            });

            $(document).keydown((e) => {
                switch (e.which) {
                    case 38:
                        this.historyPrev();
                        break;
                    case 40:
                        this.historyNext();
                        break;
                }
            });

            $('#terminal-container').click((e) => {
                if (e.target.tagName.toLowerCase() === 'pre') {return;}
                this.focus();
            });
        },
        output: function(text = '', showPrompt = true) {
            if (typeof text === 'object') {
                text = JSON.stringify(text);
            }

            let output = `<pre class="output" style="white-space:initial;">${text}</pre><br/>`
            if (text.split('\n').length > 1) {
                output = `<pre class="output">${text}</pre><br/>`;
            }

            $('#terminal').append(output);
            
            if (showPrompt) {
                this.showPrompt();
            }   
        },
        updateHistory: function(str, command) {
            // Restore fucks up history (too damn long + json), so skip it.
            if (command == 'restore') {
                return;
            }

            let index = this.history.indexOf(str);
            if (index > -1) {
                this.history.splice(index, 1);
            }

            this.history.unshift(str);
            this.historyPos = -1;

            // Make sure history length never exceeds user defined history max, or 1000 default.
            if (this.history.length >= window.settings.maxhistory || 1000) {
                this.history.slice(0, window.settings.maxhistory || 1000);
            }
            
            localStorage.setItem('history', JSON.stringify(this.history));
        },
        historyNext: function() { // next meaning newest.
            this.historyPos -= 1;

            if (this.historyPos === -1) {
                $('#input').text('');
            } else {
                $('#input').text(this.history[this.historyPos]);
            }
   
            this.focus();
        },
        historyPrev: function() { // prev meaning older.
            this.historyPos += 1;

            if (this.historyPos === this.history.length - 1) {
                return;
            } else {
                $('#input').text(this.history[this.historyPos]);
            }
            
            this.focus();
        },
        caretAtEnd: function() {
            var node = document.getElementById('input');

            if (node.innerHTML.length === 0) {
                return;
            }

            var textNode = node.firstChild;
            // innerHTML.length would give incorrect length when spaces (&nbsp;) are involved.
            var pos = $('#input').text().length;
            var range = document.createRange();
            range.setStart(textNode, pos);
            range.setEnd(textNode, pos);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
};
