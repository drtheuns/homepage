# Usage

This document describes the usage of the homepage, and some of the more "hidden" features and such.

## Overview

The homepage has three tabs by default.

1. "Other" which are primary links (used most often) and are displayed immediately on page load.
2. "Reddit" for reddit links.
3. "Todo" for a todo list.

`1`, `2`, `3` on your keyboard allow you to choose the tab.

Other than this, there is a terminal which can be accessed by pressing the tilde (key above tab -- quake style).

Enter `help` in the terminal for all the available programs. Enter `help <program_name>` for the help info about a program (or `help help` to see `help` about using `help` for looking up `help` on other programs).

## Shortcuts

The following shortcuts are available:

| Shortcut   | Function                                 |
| ---------- | ---------------------------------------- |
| `1` or `o` | View the `other` tab.                    |
| `2` or `r` | View the `reddit` tab                    |
| `3` or `t` | View the `todo` tab                      |
| `tilde`    | Toggle the `terminal`                    |
| `ESC`      | Lose focus of current element            |
| `q`        | View the hidden links in the `other` tab |



## Modules

Only modules that add something to the user experience or can be interaced with by the user will be listed here. This means that modules such as `viewHandler` will not be discussed here.

### globalSettings

Add global settings to the homepage. This is used in multiple modules, for example the terminal name / machine name are stored here. 

To set a value, use the terminal `set` module.

To get the values, use the terminal `get` module.

Common settings:

| Path                  | Description                              |
| --------------------- | ---------------------------------------- |
| `terminal.name`       | The name of the terminal. Will be visible in the prompt (`name@machine $`). |
| `terminal.machine`    | The machine name of the terminal. Will be visible in the prompt (`name@machine $`). |
| `terminal.maxhistory` | The amount of history to save for the terminal. |
| `css`                 | The parent for all CSS in the `styles` module. |
| `city`                | The Open Weather Map city ID used for the weather. See also [this list of cities](http://openweathermap.org/help/city_list.txt) |

### shortcut

Allows for shortcuts to be used. A list of shortcuts is available [above](#shortcuts).

### clock

Adds a date/time clock to the home page. The clock is updated every 5 seconds.

### notify

Allows simple notifications to be shown to the user in the top-right corner of the page. This module is used for example by `todo`, to notify the user when a todo item is overdue.

Notifications can be displayed by the user as well, through the terminal `notify` module.

### style

Allows for CSS to be stored in the `settings`. This is then loaded whenever the page is loaded. Best used for subtle / small changes, as this is loaded *after* the page is loaded, and there will therefore be a small delay.

Style can be set by using the terminal `set` module, within `css`. For example, `set css.bg body {background-color:black;}` (bad example, as this is changes the background after the page is loaded.)

### todo

Adds the functionality for the todo list in the `todo` tab. Whenever the homepage is loaded, the `todo` module will check for any overdue todo items. If there are, it will display a notification about that item. 

New todo items can be added using the input field above the todo items. Once added, it can edited by simply clicking on the text. This will transform the todo item into a textarea. Changes are saved upon losing focus (e.g. by clicking elsewhere or by pressing tab). Items can be deleted with the trash icon on the right, or marked as done by clicking the checkbox on the left.

Todo items can be given a due date by clicking on the calendar icon. This will popup a small menu with options for none (to clear the due date), 4 hours, 10 hours, 1 day, 3 days or 1 week. Hovering over, and then out of the menu will cause it to disappear. Once an item has a due date, the time remaining can be viewed by also clicking the calendar, and it will be visible on the top.

### weather

Fetches the current weather and the forecast for the coming 3 days upon page load. Only fetches the current date once every half hour and the forecast every hour, as the weather doesn't change that often. The weather is fetched from Open Weather Map, meaning an API key must be present. See also the installation guide in the main README. Once an API key is present, it will use the `mainCity` attribute to get the weather. 

Use the terminal `set` module to change the city. (e.g. `set city 2643741` for London). Changing the city setting will immediately reload the weather.

Use the terminal `weather` module to see the weather. Simply `weather` will fetch the current weather, and `weather -f` displays the forecast. See also `help weather`.

### ethereum

View the current price of Ethereum. Fetches the data once every half hour, and displays it as a notification. See also the `notify` module.

This module is disabled by default, and must the uncommented from `js/app.js`. See also the main README.

### terminal

Adds the functionality for the terminal. To open the terminal, press the tilde button.

The terminal uses the `terminal.name` and `terminal.machine` values for the prompt. These can be changed with the terminal `set` module. 

The terminal features a history of up to 1000 non-duplicate values. The value of 1000 can be changed with the `terminal.maxhistory` setting. It's recommended not to make it too big.

There is also tab completion. Typing the beginning of a program name and pressing tab will fill in the remains. For example `$ we` + tab will autocomplete to `weather`. If multiple options are possible, a list will be shown. You can scroll through this list with by pressing tab again, and pressing enter to select the currently highlighted option. Once a valid program name is entered, and tab is pressed again, it will search through your history for earlier entered values, and use these for completion.

The terminal has a number of 'programs' to use. Entering `help` will show a list of programs. Use `help <program>` to view help for the program. Documentation on the modules is available below.

## Terminal Modules

Here is the documentation for each individual terminal module. 

### echo

Returns the given text. 

**help:**

```
display a line of text
usage: echo STRING
```

### clear

Clears the terminal.

**help:**

```
clear the terminal
```

### help

Get a list of all the available programs, or display help for an individual program.

**help:**

```
display program's help
usage: help [MODULE]
```

### set

Change any of the `globalSettings` module's settings. All values are stored in an object (`window.settings`) and saved to the browser's localStorage. 

**help:**

```
change homepage settings
usage: set SETTING [VALUE]
if no value is given, the setting will be deleted.
example: set terminal.name example
```

### get

Get the value of a setting. If no setting is specified (just `get`), fetch all the settings.

**help:**

```
get value of a setting
usage: get [SETTING]
example: get terminal.name
```

### history

View your history, or search through your history. Can also be limited with the `-l` option.

**help:**

```
display (filtered) command history
usage: history [-l LIMIT] [QUERY]
```

### keycode

Given a character / characters, get the event number for Javascript. For example, `r` will return `82`, as you can see in the shortcuts at the top of `js/app.js`.

The `-s` or `source` option will display the origin of the number as well. (`r:82`, instead of just `82`).

The `-n` or `numpad` option will change any numbers from the normal numbers (keycodes 48-57) to numpad numbers (96-105).

**help:**

```
return js keycodes for given string
usage: keycode [-s SOURCE] [-n NUMPAD] INPUT
```

### backup

Backup a localStorage item, or all of localStorage. Used in conjunction with `restore`. Neither have been tested as of late, and copy is broken.

**help:**

```
make backup of localstorage
usage: backup [-c COPY] [ITEM]
example: backup | backup settings
```

### restore

Load given JSON into localStorage. Useful in conjunction with `backup`.

**help:**

```
restore localstorage from json
usage: restore DATA
```

### search

Search as you would expect. Has options for multiple search providers. Entering no query string will return a list of possible providers.

Default providers are:

- Google (default or `-g`)
- YouTube (`-y`)
- DuckDuckGo (`-d`)
- Wikipedia (`-w`)

**help:**

```
search the web for a string.
usage: search [OPTION] QUERY
```

### bm

Bookmarking system. Has submodules for settings, removing and listing the bookmarks.

**help:**

```
navigate to a bookmark
usage: bm NAME
possible methods: set | remove | list
enter `help bm method` to see help for a method.
```

### bm set

Set or edit a bookmark.

**help:**

```
set a bookmark
usage: bm set NAME LINK
```

### bm remove

Remove a bookmark

**help:**

```
remove a bookmark
usage: bm remove NAME
```

### bm list

List (with hyperlinks) all the available bookmarks.

**help:**

```
list all bookmarks
usage: bm list
```

### chan

Navigate to 4chan, or a specific board. Board can start with or without `/` (ex: `b` and `/b` are the same). Entering no board will navigate to just 4chan.org.

**help:**

```
navigate to (a) 4chan (board)
usage: chan [BOARD]
```

### reddit

Navigate to reddit or a specific link on reddit (e.g. sub, multi, user, etc). Just like `chan` this basically just appends the input to `reddit.com`. As with `4chan`, `r/all` and `/r/all` are considered the same.

**help:**

```
navigate to (a) reddit (sub)
usage: reddit [r/SUB | u/user]
```

### notify

Show a notification in the top-right corner of the screen. Duration can be chosen (in milliseconds), as well as whether or not it is an error.

**help:**

```
show a notification
usage: notify MESSAGE [;DURATION] [;ERROR]
duration: integer in miliseconds | error: "true" | "false"
example: notify Hello world;5000;true
```

### weather

Displays the weather fetched by the `weather` module. Use the `-f` option to display the 3 day forecast.

**help:**

```
get the weather, current or forecast
usage: weather [-f]
```

### lastfm

Navigate to a band or tag on Last.fm. Defaults to band, use `-t` to go to a tag.

**help:**

```
go to band or tag on last.fm
usage: lastfm [-t] QUERY
```

