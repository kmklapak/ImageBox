//this notation means: set a global called captricity to {} if it is not already defined
//if it is defined, then use the existing global value of captricity.  Because this file
//makes many assignments to captricity.BLAH, most of the values are reset to the "start state."
//However, there are values like captricity.apiToken and captricity.siteParameters which have
//code at the top level of this file that preserves state if it already exists.
var captricity = captricity || {};

// Within the context of your page, you will need to set captricity.serverURL
// By default we will use this server URL: https://shreddr.captricity.com
captricity.serverURL = captricity.serverURL || 'https://shreddr.captricity.com';

// If you are using this file from outside of the Captricity web site  you will need to set
// captricity.apiToken to the *user's* api token (not your third party developer id).
// Read about requesting access here: https://staging.captricity.com/developer/
captricity.apiToken = captricity.apiToken || null;

// Make webkit and moz blob builder available at window.BlobBuilder
if (!window.BlobBuilder && window.WebKitBlobBuilder) {
    window.BlobBuilder = window.WebKitBlobBuilder;
}
if(!window.BlobBuilder && window.MozBlobBuilder){
    window.BlobBuilder = window.MozBlobBuilder;
}

// Add key:value pairs for parameters which you'd like added to every API request made via these Backbone classes
if(typeof captricity.siteParameters === 'undefined') captricity.siteParameters = {};

captricity.APIResource = Backbone.Model.extend({});

captricity.APISchema = Backbone.Collection.extend({
});

captricity.APISchema.prototype.initialize = function(models,props){
    this.bind('reset', this.generateBackboneClasses, this);
    this.model=captricity.APIResource;
    this.url = function() {
        endpoint = captricity.serverURL + '/api/backbone/schema';
        if (props == undefined || props.desiredVersion == undefined) {
            return endpoint;
        }
        return endpoint + '?version=' + props["desiredVersion"];
    };
}

captricity.APISchema.prototype.parse = function(response){
    this.name = response.name;
    this.endpoint = response.endpoint;
    this.version = response.version;
    return response.resources;
}

captricity.APISchema.prototype.generateBackboneClasses = function(){
    //This empties out captricity.api and populates it with Backbone Models and Collections for each resource in the schema.
    //Also, it populates captricity.url with functions which generate URLs to API resources.
    captricity.api = {};
    captricity.url = {};

    // First set up the non-list resources as Models
    for(var i=0; i < this.models.length; i++){
        if(this.models[i].get('is_list')) continue;
        if(this.models[i].get('is_action')) continue;
        var resourceModel = this.models[i];
        var modelName = this.resourceNameToModelName(resourceModel.get('name'));
        var initial_data = {
            regex: resourceModel.get('regex'),
            doc: resourceModel.get('doc'),
            property_doc: resourceModel.get('property_doc'),
            supported: resourceModel.get('supported'),
            allowed_request_methods: resourceModel.get('allowed_request_methods'),
            arguments: resourceModel.get('arguments'),
            resourceModel:resourceModel,
            schema: this
        };
        captricity.api[modelName] = captricity.APIModel.extend(initial_data);
    }

    // Now set up the list resources as Collections
    for(var i=0; i < this.models.length; i++){
        if(!this.models[i].get('is_list')) continue;
        if(this.models[i].get('is_action')) continue;
        var resourceModel = this.models[i];
        var modelName = this.resourceNameToModelName(resourceModel.get('name'));
        var initial_data = {
            regex: resourceModel.get('regex'),
            doc: resourceModel.get('doc'),
            supported: resourceModel.get('supported'),
            allowed_request_methods: resourceModel.get('allowed_request_methods'),
            arguments: resourceModel.get('arguments'),
            resourceModel:resourceModel,
            schema: this
        };
        // Check to see if we can use one of the previously defined resource Models as this collection's model
        if(resourceModel.get('listed_resource')){
            var childModelName = this.resourceNameToModelName(resourceModel.get('listed_resource'));
            if(captricity.api[childModelName]){
                initial_data['model'] = captricity.api[childModelName];
            } else {
                console.error('The schema says that', resourceModel.get('name'), 'has a listed_resource of', resourceModel.get('listed_resource'), 'but that does not seem to be a valid API resource.');
            }
        }
        captricity.api[modelName] = captricity.APICollection.extend(initial_data);
    }

    // Now set up captricity.url with functions to generate URLs for each resource
    for(var i=0; i < this.models.length; i++){
        var resourceModel = this.models[i];
        var functionName = this.resourceNameToFunctionName(resourceModel.get('name'));
        captricity.url[functionName] = _.bind(function(){
            return captricity.generateSchemaURL(this.get('regex'), arguments);
        }, resourceModel);
    }
}

captricity.APISchema.prototype.resourceNameToFunctionName = function(resourceName){
    var functionName = this.resourceNameToModelName(resourceName);
    return functionName[0].toLowerCase() + functionName.substring(1)
}

captricity.APISchema.prototype.resourceNameToModelName = function(resourceName){
    // Convert a resource name like box_model to BoxModel
    var tokens = resourceName.split('_');
    for(var i=0; i < tokens.length; i++){
        tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].substring(1,tokens[i].length);
    }
    return tokens.join('');
}

captricity.APICollection = Backbone.Collection.extend({});

captricity.APICollection.prototype.url = function(){
    return captricity.generateSchemaURL(this.regex, captricity.generateURLArguments(this));
}

captricity.APIModel = Backbone.Model.extend({});

captricity.APIModel.prototype.url = function(){
    if(this.isNew() && this.collection){
        return this.collection.url();
    }
    return captricity.generateSchemaURL(this.regex, captricity.generateURLArguments(this));
}

captricity.apiSync = function(method, model, options){
    var version = this.schema.version;
    var new_options =  _.extend({
        beforeSend: function(xhr) {
            if(captricity.apiToken){
                xhr.setRequestHeader('X_API_TOKEN', captricity.apiToken);
                xhr.setRequestHeader('X_API_VERSION', version);
            }
        }
    }, options)
    return Backbone.sync(method, model, new_options);
}

captricity.APICollection.prototype.sync = captricity.apiSync;
captricity.APIModel.prototype.sync = captricity.apiSync;


captricity.generateURLArguments = function(instance){
    /*
    Generate an array of argument values which one might pass when
    generating a URL for a Model or Collection (the instance parameter),
    say to captricity.generateSchemaURL like so:
    captricity.generateSchemaURL(instance.regex, captricity.generateURLArguments(instance));
    */
    var results = [];
    // For each of the argument names, look for an instance property or a BackboneModel.get() result
    for(var i=0; i < instance.arguments.length; i++){
        if(typeof instance[instance.arguments[i]] != 'undefined'){
            results[results.length] = instance[instance.arguments[i]];
        } else if ( (typeof instance.get != 'undefined') && (instance.get(instance.arguments[i]) != null) ){
            results[results.length] = instance.get(instance.arguments[i]);
        } else{
            results[results.length] = null;
        }
    }
    return results;
}

captricity.generateSchemaURL = function(regex, url_arguments){
    /*
    Given a resource's regular expression string (as provided by the API schema),
    and an array of arguments which match that regex's pattern groups,
    return a URL string.
    */
    regexTokens = captricity.splitSchemaRegex(regex);
    result = ''
    for(var i=0; i < url_arguments.length; i++){
        result = result + (regexTokens[i] ? regexTokens[i] : '/');
        if(url_arguments[i] == null) continue;
        result = result + url_arguments[i];
    }
    if(regexTokens.length > url_arguments.length){
        result = result + regexTokens[regexTokens.length - 1]
    }
    var hostURL = captricity.serverURL;
    if(Object.keys(captricity.siteParameters).length == 0){
        return hostURL + result;
    } else {
        return hostURL + result + '?' + _.map(Object.keys(captricity.siteParameters), function(key){
            return encodeURIComponent(key) + '=' + encodeURIComponent(captricity.siteParameters[key]);
        }).join('&');
    }
}

captricity.splitSchemaRegex = function(regex){
    // Return an array of the URL split at each regex match like (?P<id>[\d]+)
    ///Call with a regex of '^/foo/(?P<id>[\d]+)/bar/$' and you will receive ['/foo/', '/bar/']
    if(regex.charAt(0) == '^') regex = regex.substring(1, regex.length);
    if(regex.charAt(regex.length - 1) == '$') regex = regex.substring(0, regex.length - 1)
    results = []
    line = ''
    for(var i =0; i < regex.length; i++){
        var c = regex.charAt(i);
        if(c == '('){
            results[results.length] = line;
            line = '';
        } else if(c == ')'){
            line = '';
        } else {
            line = line + c;
        }
    }
    if(line.length > 0) results[results.length] = line
    return results
}

function leftPad(token, length){
    var result = '' + token;
    while(result.length < length){
        result = '0' + result;
    }
    return result;
}

captricity.formatJSONDate = function(date){
    return date.getFullYear() + '-' + leftPad(date.getMonth(), 2) + '-' + leftPad(date.getDate(), 2) + 'T' + leftPad(date.getHours(), 2) + ':' + leftPad(date.getMinutes(), 2) + ':' + leftPad(date.getSeconds(), 2);
}

captricity.parseJSONDate = function(jsonDate){
    //takes a jsonDate as provided by backbone: "2012-04-24T13.55.03" and returns a Javascript Date instance
    var dateString = jsonDate.split('T')[0];
    var timeArray = jsonDate.split('T')[1].split(':');
    var date = $.datepicker.parseDate('yy-mm-dd', dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(timeArray[0], 10), parseInt(timeArray[1], 10), parseInt(timeArray[2], 10));
}

// Convenient shortcut for getting from and posting to captricity api url
captricity.apiPost = function(url, data, success, error) {
    var headers = {};
    if (captricity.apiToken) {
        headers['Captricity-API-Token'] = captricity.apiToken;
    }
    $.ajax({
        url: url,
        data: data,
        success: success,
        dataType: 'json',
        error: error,
        type: "POST",
        headers: headers
    });
};
captricity.apiGet = function(url, success, error) {
    var headers = {};
    if (captricity.apiToken) {
        headers['Captricity-API-Token'] = captricity.apiToken;
    }
    $.ajax({
        url: url,
        success: success,
        error: error,
        type: "GET",
        headers: headers
    });
};
captricity.apiDelete = function(url, success, error) {
    var headers = {};
    if (captricity.apiToken) {
        headers['Captricity-API-Token'] = captricity.apiToken;
    }
    $.ajax({
        url: url,
        success: success,
        error: error,
        type: "DELETE",
        headers: headers
    });
};


captricity.MultipartUploader = function(data, progressCallback, destinationURL, method){
    /*
    This uploads data (which should be a map) using the multipart form encoding.
    Any values in the data which are files are loaded using FileReaders.
    */
    this.method = method || 'POST';
    this.progressCallback = progressCallback;
    this.boundary = '------multipartformboundary' + (new Date).getTime();
    this.destinationURL = destinationURL || '.';
    this.percentage = 0;
    this.filesRead = 0;
    this.files = {};
    this.body = '';
    this.xhr = new XMLHttpRequest();

    this.progressFunction = function(event) {
        if (event.lengthComputable) {
            this.percentage = Math.round((event.loaded * 100) / event.total);
            if(this.percentage == 100) return; // The loadFunction calls it with 100%
            if(this.progressCallback) this.progressCallback(this, this.percentage);
        }
    };

    if(typeof this.xhr.upload !== "undefined") {
        this.xhr.upload.addEventListener("progress", _.bind(this.progressFunction, this), false);
    }

    this.handleReadyStateChange = function(event){
        if(this.xhr.readyState == 4 && this.xhr.status == 200) this.loadFunction();
        if(this.xhr.readyState == 4 && this.xhr.status != 200) this.errorFunction();
    }
    this.xhr.onreadystatechange = _.bind(this.handleReadyStateChange, this);

    this.errorFunction = function(e){
        this.percentage = -1;
        if(this.progressCallback) this.progressCallback(this, this.percentage);
    };

    this.loadFunction = function(e){
        this.percentage = 100;
        if(this.progressCallback) this.progressCallback(this, this.percentage);
    };

    this.handleFileLoaded = function(event){
        var reader = event.target;
        this.body = this.body + captricity.serializeForPost(reader._file.name, reader.result, this.boundary, reader._parameterName, 'application/octet-stream', false);
        this.filesRead += 1;
        if(this.filesRead == Object.keys(this.files).length) this.startUpload();
    };

    this.handleFileLoadedIE9 = function(event){
        var reader = event.target;
        var mimeType = getMIMETypeFromFileName(this.fileName);
        this.body = this.body + captricity.serializeForPost(this.fileName, reader.result, this.boundary, this.parameterName, mimeType, true);
        this.filesRead += 1;
        if(this.filesRead == Object.keys(this.files).length) this.startUploadIE9();
    };

    this.setupUpload = function(){
        this.xhr.open(this.method, this.destinationURL, true);
        this.xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + this.boundary);
        // If there is no api token, assume session only access
        if (!captricity.apiToken) {
            this.xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken')); // This is for Django's XSS middleware
        } else {
            this.xhr.setRequestHeader('Captricity-API-Token', captricity.apiToken);
        }
    };

    // Called to start the upload.
    // If there are files in the data, this is called once all of the FileReaders are finished loading.
    this.startUpload = function(){
        this.setupUpload();
        this.xhr.sendAsBinary(this.body, 'multipart/form-data');
    };

    // Called to start the upload.
    // If there are files in the data, this is called once all of the FileReaders are finished loading.
    this.startUploadIE9 = function(){
        this.setupUpload();
        this.xhr.send(this.body);
    };

    for(var key in data){
        if(data[key] == null){
            // pass
        } else if(typeof data[key] == 'object'){
            this.files[key] = data[key];
        } else {
            this.body = this.body + captricity.serializeForPost(null, data[key], this.boundary, key, 'text/plain', false);
        }
    }
    if(Object.keys(this.files).length == 0){
        this.startUpload();
    } else {
        for(var key in this.files){
            if (captricity.getIEVersion() == 9) {
                // Be aware!  The FileReader here is NOT the standard file reader.  It comes from the dropfile polyfill and
                // is lacking some functionality.
                var reader = new FileReader();
                this.fileName = this.files[key].name;
                this.parameterName = key;
                reader.onload = _.bind(this.handleFileLoadedIE9, this);
                reader.readAsBinaryString(this.files[key]);

            } else {
                var reader = new FileReader();
                reader._file = this.files[key];
                reader._parameterName = key;
                reader.onload = _.bind(this.handleFileLoaded, this);
                reader.readAsArrayBuffer(this.files[key]);
            }
        }
    }
}

// This takes a string and adds spaces to the end until the length of the string is a multiple of four.
// It is used to get around a bug in Django 1.4 where base64 data in forms is not decoded correctly.
function padLengthToMultipleOfFour(string) {
    while (string.length % 4 != 0) {
        string += " ";
    }
    return string;
}

// There is some strange things happening here with useBase64Encoding and padLengthToMultipleOfFour.  Both of these
// things are used to add IE 9 support.  When using IE 9, files are encoded base64.  Due to a bug in Django 1.4,
// this base64 data must start a multiple of four characters from the beginning of the post data.
// https://code.djangoproject.com/ticket/19036
captricity.serializeForPost = function(filename, data, boundary, parameterName, contentType, useBase64Encoding) {
    /*
    Create a multipart POST body which encodes the data
    */
    var dashdash = '--';
    var crlf = '\r\n';
    var builder = '';

    builder += dashdash;
    builder += boundary;
    builder += crlf;
    builder += 'Content-Disposition: form-data; name="' + parameterName + '"';
    if(filename) builder += '; filename="' + filename + '"';
    builder += crlf;

    builder += 'Content-Type: ' + contentType;

    if (useBase64Encoding) {
        builder += crlf;
        builder += "Content-Transfer-Encoding: base64";
    }

    builder += crlf;
    builder += crlf;

    if (typeof data==="object") {
        var formattedData = pack(new Uint8Array(data));
    } else {
        var formattedData = data;
    }

    if (useBase64Encoding) {
        builder = padLengthToMultipleOfFour(builder);
        formattedData = btoa(formattedData);
    }

    builder += formattedData;
    builder += crlf;
    builder += dashdash;
    builder += boundary;
    builder += dashdash;
    builder += crlf;

    builder = padLengthToMultipleOfFour(builder);

    return builder;
}

/**
http://codereview.stackexchange.com/questions/3569/pack-and-unpack-bytes-to-strings
not
http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
which will die on safari
*/

function pack(bytes) {
    var str = "";
    for(var i = 0; i < bytes.length; i += 1) {
        str += String.fromCharCode(bytes[i]);
    }
    return str;
}
/*utility function: http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers*/
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

if (XMLHttpRequest.prototype) {
    XMLHttpRequest.prototype.sendAsBinary = function(text, mimeType){
        /*
        A utility function to convert text to a blob
        */
        var data = new ArrayBuffer(text.length);
        var ui8a = new Uint8Array(data, 0);
        for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);
        this.send(new Blob([data], {"type": mimeType}));
    }
}

//http://stackoverflow.com/questions/17907445/how-to-detect-ie11
captricity.getIEVersion = function() {
    var rv = -1;

    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    } else if (navigator.appName == 'Netscape') {
        var ua = navigator.userAgent;
        var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    }
    return rv;
}
