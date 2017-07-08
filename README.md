# Homepage & Terminal

An easily extend-able homepage. 

## Usage

Explanation on the usage of the homepage can be found [here](docs/usage.md).

## Install

1. Git clone or download and unzip the repository in the directory of your choice.
2. Set the `home.html` file in the project root as the new tab page for your favorite browser. For chrome/chromium you could use [Replace New Tab Page](https://chrome.google.com/webstore/detail/replace-new-tab-page/cnkhddihkmmiiclaipbaaelfojkmlkja?utm_source=chrome-app-launcher-info-dialog). Link the new tab to `file:///path/to/project/home.html`.

### Extra

- Set the `apiKey` and `mainCity` for the `weather` module. These can be found in [`js/app.js`](js/app.js) in the `weather` module. This will allow your page to check the weather for your chosen city. Once done, build project (see [`build`](build)). Alternatively, you could set these variables in the [`dest/js/app.js`](dest/js/app.js) minified file, so avoid having to build. Any builds after this, will override the settings though.

  [Open Weather Map](https://openweathermap.org/) is used to fetch the weather. To get an API key, simply create an account. Once created and logged in, go to your [api keys in the dashboard](https://home.openweathermap.org/api_keys) and create one (free).

  The city ID can be found in [this list by openweathermap](http://openweathermap.org/help/city_list.txt). The city can also be set from within the terminal in the homepage. Use `set city <id>` (ex. `set city 2643741` which sets it to London). This will also immediately re-fetch the weather.

- There is an Ethereum module (disabled by default), which will check the current price of Ethereum in euros every half hour and notify you when you open a new tab. To use it, uncomment the module in [`js/app.js`](js/app.js) and build the project. You can change the currency in which to display the current price by changing the `apiUrl` within the module, and any reference to `this.price.EUR`.  

## Issues

For any issues, open an issue here on Github.