(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["additional-content-form"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"content-header\">";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"slug"), env.opts.autoescape);
;
}
else {
output += "New additional content";
;
}
output += "<i class=\"fa fa-times delete-additional\" data-confirm=\"\"></i></div>\n\n<input type=\"hidden\" id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_id\" class=\"field-id\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_id\" value=\"\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\">\n\n<div class=\"row\">\n    <div class=\"medium-6 columns form-group\">\n        <input id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_slug\" class=\"field-slug\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_slug\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" type=\"text\" value=\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"slug"), env.opts.autoescape);
;
}
output += "\" required=\"\">\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_slug\" class=\"control-label\">Slug<span class=\"required-marker\">*</span></label>\n        <i class=\"bar\"></i>\n        <div class=\"form-help\">Enter a unique value.</div>\n\n    </div>\n    <div class=\"medium-6 columns\"></div>\n</div>\n\n<div class=\"row\">\n    <div class=\"medium-4 columns form-group\">\n        <input id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_type\" class=\"field-type to-selectize\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_type\" type=\"text\" placeholder=\"Choose an option\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" value=\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"type"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_type\" class=\"control-label\">Type<span class=\"required-marker\">*</span></label>\n        <i class=\"bar\"></i>\n    </div>\n    <div class=\"medium-2 columns form-group length-group\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"type") == "text") {
output += " style=\"display: block;\"";
;
}
;
}
output += ">\n        <input id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_length\" class=\"field-length form-select-inches\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_length\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" type=\"number\" value=\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"length")) {
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "formattedLength"), env.opts.autoescape);
;
}
;
}
output += "\" required=\"\" ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"type") != "text") {
output += "disabled=\"\" ";
;
}
;
}
else {
output += "disabled=\"\" ";
;
}
output += "/>\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_length\" class=\"control-label\">Inches</label>\n        <i class=\"bar\"></i>\n    </div>\n    <div class=\"medium-6 columns\"></div>\n</div>\n\n<div class=\"row\">\n    <!--  -->\n    <div class=\"medium-12 columns form-group\">\n        <div class=\"expanding-holder";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"budgetLine")) > 0) {
output += " has-value";
;
}
;
}
output += "\">\n            <textarea id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_budgetline\" class=\"field-budgetline\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_budgetline\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" rows=\"1\" required=\"\">";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"budgetLine");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("budgetLineGraf", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += runtime.suppressValue(t_4, env.opts.autoescape);
;
}
}
frame = frame.pop();
;
}
output += "</textarea>\n        </div>\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_budgetline\" class=\"control-label\">Budget line<span class=\"required-marker\">*</span></label>\n        <i class=\"bar\"></i>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"medium-6 columns form-group set-authors\">\n        <input id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_authors\" class=\"field-authors to-selectize staff-select reporter\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_authors\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" type=\"text\" value=\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
frame = frame.push();
var t_7 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"authors");
if(t_7) {var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("author", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += runtime.suppressValue(runtime.memberLookup((t_8),"email"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ",";
;
}
;
}
}
frame = frame.pop();
;
}
output += "\" />\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_authors\" class=\"control-label\">Author(s)<span class=\"required-marker\">*</span></label>\n        <i class=\"bar\"></i>\n    </div>\n    <div class=\"medium-6 columns form-group set-editors\">\n        <input id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_editors\" class=\"field-editors to-selectize staff-select editor\" name=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_editors\" data-form=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "\" type=\"text\" value=\"";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"editors")) {
frame = frame.push();
var t_11 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"boundData")),"editors");
if(t_11) {var t_10 = t_11.length;
for(var t_9=0; t_9 < t_11.length; t_9++) {
var t_12 = t_11[t_9];
frame.set("editor", t_12);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10 - t_9);
frame.set("loop.revindex0", t_10 - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10 - 1);
frame.set("loop.length", t_10);
output += runtime.suppressValue(runtime.memberLookup((t_12),"email"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ",";
;
}
;
}
}
frame = frame.pop();
;
}
;
}
output += "\" />\n        <label for=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "config")),"formID"), env.opts.autoescape);
output += "_editors\" class=\"control-label\">Editor(s)</label>\n        <i class=\"bar\"></i>\n    </div>\n</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["main-content"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<h1>Rendered.</h1>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["modal-base"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"modal-inner\">\n    <h1>";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "modalTitle"), env.opts.autoescape);
output += "</h1>\n    ";
if(runtime.contextOrFrameLookup(context, frame, "formConfig")) {
output += "<form id=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "innerID"), env.opts.autoescape);
output += "\" action=\".\" method=\"POST\" data-abide=\"ajax\">";
;
}
else {
output += "<div id=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "innerID"), env.opts.autoescape);
output += "\" class=\"form-replacement\">";
;
}
output += "\n        ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "formConfig")),"rows");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("row", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n        <div class=\"row\">\n            ";
frame = frame.push();
var t_7 = runtime.memberLookup((t_4),"fields");
if(t_7) {var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("field", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n            <div class=\"column ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"widthClasses"), env.opts.autoescape);
output += "\">\n                <label>";
output += runtime.suppressValue(runtime.memberLookup((t_8),"labelText"), env.opts.autoescape);
output += " <input name=\"";
output += runtime.suppressValue(runtime.memberLookup((t_8),"inputName"), env.opts.autoescape);
output += "\" type=\"";
output += runtime.suppressValue(runtime.memberLookup((t_8),"inputType"), env.opts.autoescape);
output += "\" value=\"";
if(runtime.memberLookup((t_8),"inputValue")) {
output += runtime.suppressValue(runtime.memberLookup((t_8),"inputValue"), env.opts.autoescape);
;
}
output += "\" id=\"";
output += runtime.suppressValue(runtime.memberLookup((t_8),"inputID"), env.opts.autoescape);
output += "\"></label>\n            </div>\n            ";
;
}
}
frame = frame.pop();
output += "\n        </div>\n        ";
;
}
}
frame = frame.pop();
output += "\n\n        ";
if(runtime.contextOrFrameLookup(context, frame, "extraHTML")) {
output += "\n            ";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.contextOrFrameLookup(context, frame, "extraHTML")), env.opts.autoescape);
output += "\n        ";
;
}
output += "\n\n        <div class=\"button-holder\">\n            ";
frame = frame.push();
var t_11 = runtime.contextOrFrameLookup(context, frame, "buttons");
if(t_11) {var t_10 = t_11.length;
for(var t_9=0; t_9 < t_11.length; t_9++) {
var t_12 = t_11[t_9];
frame.set("button", t_12);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10 - t_9);
frame.set("loop.revindex0", t_10 - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10 - 1);
frame.set("loop.length", t_10);
output += "\n            <div id=\"";
output += runtime.suppressValue(runtime.memberLookup((t_12),"buttonID"), env.opts.autoescape);
output += "\" class=\"button ";
output += runtime.suppressValue(runtime.memberLookup((t_12),"buttonClass"), env.opts.autoescape);
output += " click-init\"><span>";
output += runtime.suppressValue(runtime.memberLookup((t_12),"innerLabel"), env.opts.autoescape);
output += "</span></div>\n            ";
;
}
}
frame = frame.pop();
output += "\n            <div class=\"clearer\"></div>\n        </div>\n    ";
if(runtime.contextOrFrameLookup(context, frame, "formConfig")) {
output += "</form>";
;
}
else {
output += "</div>";
;
}
output += "\n</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["navigation-logo"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<img src=\"img/dmn_masthead.png\">";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["navigation-user-info"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<tag class=\"white\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "currentUser")),"email"), env.opts.autoescape);
output += " <i class=\"fa fa-lock neon\"></i></tag>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["navigation"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div id=\"logo-holder\" class=\"top-bar-left\"></div>\n<div id=\"user-info-holder\" class=\"top-bar-right\"></div>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["package-empty"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<h3>No content matched your search.</h3>\n<p>Remove some filters to see more matches.</p>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["package-item-additionalcontent"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "        <li class=\"content-item\" ready=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"isReady"), env.opts.autoescape);
output += "\" content-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"id"), env.opts.autoescape);
output += "\">\n            <div class=\"row\">\n                <div class=\"knockout column small-1 medium-1 large-1\"></div>\n                <div class=\"visible-area column small-10 medium-10 large-10\">\n                    <div class=\"slug-bar row\">\n                        <div class=\"column small-6 medium-7 large-7\">\n                            <div class=\"ready-check\"><i class=\"fa fa-check\"></i></div>\n                            <h3>";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"slug"), env.opts.autoescape);
output += "</h3>\n                        </div>\n                        <div class=\"author-info column small-6 medium-5 large-5\">\n                            ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"authors")) > 0) {
output += "\n                            <h4>";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"authors")) == 1) {
output += "Author";
;
}
else {
output += "Authors";
;
}
output += ": ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"authors");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("author", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += runtime.suppressValue(runtime.memberLookup((t_4),"formattedName"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ", ";
;
}
;
}
}
frame = frame.pop();
output += "</h4>\n                            ";
;
}
output += "\n\n                            ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"editors")) > 0) {
output += "\n                            <h4>";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"editors")) == 1) {
output += "Editor";
;
}
else {
output += "Editors";
;
}
output += ": ";
frame = frame.push();
var t_7 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"editors");
if(t_7) {var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("editor", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += runtime.suppressValue(runtime.memberLookup((t_8),"formattedName"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ", ";
;
}
;
}
}
frame = frame.pop();
output += "</h4>\n                            ";
;
}
output += "\n                        </div>\n                    </div>\n\n                    <div class=\"additional-package-info row\">\n                        <div class=\"column small-6 medium-8 large-8 text-left\">\n                            <div class=\"additional-info-line\"><i class=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"typeMeta")),"icon"), env.opts.autoescape);
output += "\"></i>&thinsp;&nbsp;";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"typeMeta")),"verboseName"), env.opts.autoescape);
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"length")) {
output += " (";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"length"), env.opts.autoescape);
output += ")";
;
}
output += "</div>\n                        </div>\n                        <div class=\"column small-6 medium-4 large-4 text-center\">\n                        </div>\n                    </div>\n\n                    <div class=\"related-description row\">\n                        <div class=\"budget-line column small-12 medium-12 large-12\">\n                            ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"budgetLine")) > 0) {
output += "\n                                ";
frame = frame.push();
var t_11 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "item")),"budgetLine");
if(t_11) {var t_10 = t_11.length;
for(var t_9=0; t_9 < t_11.length; t_9++) {
var t_12 = t_11[t_9];
frame.set("line", t_12);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10 - t_9);
frame.set("loop.revindex0", t_10 - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10 - 1);
frame.set("loop.length", t_10);
output += "<p>";
output += runtime.suppressValue(env.getFilter("safe").call(context, t_12), env.opts.autoescape);
output += "</p>";
;
}
}
frame = frame.pop();
output += "\n                            ";
;
}
else {
output += "\n                                <p>(None specified)</p>\n                            ";
;
}
output += "\n                        </div>\n                    </div>\n\n                </div>\n                <div class=\"action-buttons column small-1 medium-1 large-1 text-center\">\n                    <div class=\"mark-ready action-button\">\n                        <i class=\"fa fa-check\"></i>\n                        <span class=\"hover-info\">Mark ready</span>\n                    </div>\n                    <div class=\"subscribe action-button\">\n                        <i class=\"fa fa-envelope-o\"></i>\n                        <span class=\"hover-info\">Subscribe</span>\n                    </div>\n                </div>\n            </div>\n        </li>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["package-item"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"package-sheet\" content-id=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "id"), env.opts.autoescape);
output += "\" content-primary-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"id"), env.opts.autoescape);
output += "\" data-hub=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "hub"), env.opts.autoescape);
output += "\" data-vertical=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "verticalSlug"), env.opts.autoescape);
output += "\" data-all-people=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "allPeople"), env.opts.autoescape);
output += "\" data-full-text=\"\" ready=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"isReady"), env.opts.autoescape);
output += "\">\n    <div class=\"minimal-card\">\n        <div class=\"slug-bar row\">\n            <div class=\"column small-6 medium-8 large-8\">\n                <div class=\"color-dot\" style=\"background-color: ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "hubDotColor"), env.opts.autoescape);
output += ";\"><span class=\"ready-check\"><i class=\"fa fa-check\"></i></span></div>\n                <h1>";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"slug"), env.opts.autoescape);
output += "</h1>\n                <h2>";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "pubDate")),"formatted"), env.opts.autoescape);
output += "</h2>\n            </div>\n            <div class=\"author-info column small-5 medium-3 large-3\">\n                ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"authors")) > 0) {
output += "\n                <h3>";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"authors")) == 1) {
output += "Author";
;
}
else {
output += "Authors";
;
}
output += ": ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"authors");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("author", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += runtime.suppressValue(runtime.memberLookup((t_4),"formattedName"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ", ";
;
}
;
}
}
frame = frame.pop();
output += "</h3>\n                ";
;
}
output += "\n                ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"editors")) > 0) {
output += "\n                <h3 class=\"additional-info-line\">";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"editors")) == 1) {
output += "Editor";
;
}
else {
output += "Editors";
;
}
output += ": ";
frame = frame.push();
var t_7 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"editors");
if(t_7) {var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("editor", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += runtime.suppressValue(runtime.memberLookup((t_8),"formattedName"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ", ";
;
}
;
}
}
frame = frame.pop();
output += "</h3>\n                ";
;
}
output += "\n            </div>\n            <div class=\"action-buttons column small-1 medium-1 large-1 text-center\">\n                <a href=\"/#edit/";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "id"), env.opts.autoescape);
output += "/\">\n                    <div class=\"edit action-button\">\n                        <i class=\"fa fa-pencil-square-o\"></i>\n                        <span class=\"hover-info\">Edit</span>\n                    </div>\n                </a>\n                <div class=\"mark-ready action-button\">\n                    <i class=\"fa fa-check\"></i>\n                    <span class=\"hover-info\">Mark ready</span>\n                </div>\n                <div class=\"subscribe action-button\">\n                    <i class=\"fa fa-envelope-o\"></i>\n                    <span class=\"hover-info\">Subscribe</span>\n                </div>\n            </div>\n        </div>\n\n        <div class=\"additional-package-info row\">\n            <div class=\"column small-6 medium-6 large-6 text-left\">\n                <div class=\"additional-info-line\"><i class=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"typeMeta")),"icon"), env.opts.autoescape);
output += "\"></i>&thinsp;&nbsp;";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"typeMeta")),"verboseName"), env.opts.autoescape);
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"length")) {
output += " (";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"length"), env.opts.autoescape);
output += ")";
;
}
output += "</div>\n            </div>\n            <div class=\"related-types column small-5 medium-5 large-5 text-right\"><div class=\"additional-info-line\">";
if(env.getFilter("length").call(context, runtime.contextOrFrameLookup(context, frame, "additionalTypes")) > 0) {
output += "Includes ";
frame = frame.push();
var t_11 = runtime.contextOrFrameLookup(context, frame, "additionalTypes");
if(t_11) {var t_10 = t_11.length;
for(var t_9=0; t_9 < t_11.length; t_9++) {
var t_12 = t_11[t_9];
frame.set("type", t_12);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10 - t_9);
frame.set("loop.revindex0", t_10 - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10 - 1);
frame.set("loop.length", t_10);
output += "<i class=\"";
output += runtime.suppressValue(runtime.memberLookup((t_12),"icon"), env.opts.autoescape);
output += "\"></i>";
;
}
}
frame = frame.pop();
;
}
output += "</div>\n            </div>\n            <div class=\"action-buttons column small-1 medium-1 large-1 text-center\">\n                <div class=\"expand-package action-button\">\n                    <i class=\"fa fa-level-down\"></i>\n                    <i class=\"fa fa-level-up\"></i>\n                    <span class=\"hover-info\">More about this item</span>\n                </div>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"primary-description row  small-11 medium-11 large-11 float-left\">\n        <div class=\"budget-line collapsed column small-12 medium-9 large-9\">\n            <div class=\"clearer\"></div>\n            ";
frame = frame.push();
var t_15 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "primaryContent")),"budgetLine");
if(t_15) {var t_14 = t_15.length;
for(var t_13=0; t_13 < t_15.length; t_13++) {
var t_16 = t_15[t_13];
frame.set("line", t_16);
frame.set("loop.index", t_13 + 1);
frame.set("loop.index0", t_13);
frame.set("loop.revindex", t_14 - t_13);
frame.set("loop.revindex0", t_14 - t_13 - 1);
frame.set("loop.first", t_13 === 0);
frame.set("loop.last", t_13 === t_14 - 1);
frame.set("loop.length", t_14);
output += "<p>";
output += runtime.suppressValue(env.getFilter("safe").call(context, t_16), env.opts.autoescape);
output += "</p>";
;
}
}
frame = frame.pop();
output += "\n        </div>\n        <div class=\"item-options column small-12 medium-3 large-3\">\n            <div class=\"option-list row\">\n                <div class=\"notes option column small-4 medium-12 large-12\"><i class=\"fa fa-comments-o\"></i>&thinsp;&nbsp;View notes</div>\n                <div class=\"web-info option column small-4 medium-12 large-12\"><i class=\"fa fa-desktop\"></i>&thinsp;&nbsp;Web info</div>\n                <div class=\"print-info option column small-4 medium-12 large-12\"><i class=\"fa fa-newspaper-o\"></i>&thinsp;&nbsp;Print info</div>\n            </div>\n        </div>\n    </div>\n    <div class=\"clearer\"></div>\n</div>\n";
if(env.getFilter("length").call(context, runtime.contextOrFrameLookup(context, frame, "additionalContent")) > 0) {
output += "\n<div class=\"extra-sheet\">\n    <ul class=\"related-content\">\n        ";
frame = frame.push();
var t_19 = runtime.contextOrFrameLookup(context, frame, "additionalContent");
if(t_19) {var t_18 = t_19.length;
for(var t_17=0; t_17 < t_19.length; t_17++) {
var t_20 = t_19[t_17];
frame.set("item", t_20);
frame.set("loop.index", t_17 + 1);
frame.set("loop.index0", t_17);
frame.set("loop.revindex", t_18 - t_17);
frame.set("loop.revindex0", t_18 - t_17 - 1);
frame.set("loop.first", t_17 === 0);
frame.set("loop.last", t_17 === t_18 - 1);
frame.set("loop.length", t_18);
output += "\n            ";
env.getTemplate("package-item-additionalcontent", false, "package-item", null, function(t_23,t_21) {
if(t_23) { cb(t_23); return; }
t_21.render(context.getVariables(), frame, function(t_24,t_22) {
if(t_24) { cb(t_24); return; }
output += t_22
output += "\n        ";
})});
}
}
frame = frame.pop();
output += "\n    </ul>\n</div>\n";
;
}
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["packages-edit"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"center-content\">\n    <div class=\"edit-bar\">\n        <div class=\"button-holder\">\n            ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "<div class=\"delete-trigger button flat-button\"><span>Delete</span></div>";
;
}
output += "\n            <div class=\"primary-action save-trigger button flat-button\"><span>Save</span></div>\n            <div class=\"save-and-continue-editing-trigger button flat-button show-for-medium\"><span>Save &amp; continue editing</span></div>\n            <div class=\"clearer\"></div>\n        </div>\n    </div>\n    <div class=\"single-page\">\n        <div class=\"package-header\">\n            <div class=\"color-dot\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += " style=\"background-color: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"hubColor"), env.opts.autoescape);
output += ";\"";
;
}
output += "></div>\n            <h1>";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"slug"), env.opts.autoescape);
;
}
else {
output += "Add content";
;
}
output += "</h1>\n        </div>\n        <form id=\"package-form\">\n            <input type=\"hidden\" name=\"csrfmiddlewaretoken\" value=\"\">\n            <input type=\"hidden\" id=\"package_id\" name=\"package_id\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"id"), env.opts.autoescape);
;
}
output += "\" data-form=\"package\">\n            <input type=\"hidden\" id=\"primary_id\" name=\"primary_id\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"id"), env.opts.autoescape);
;
}
output += "\" data-form=\"primary\">\n\n            <div class=\"row\">\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"slug\" name=\"slug\" data-form=\"primary\" type=\"text\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"slug"), env.opts.autoescape);
;
}
output += "\" required=\"\">\n                    <label for=\"slug\" class=\"control-label\">Slug<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                    <div class=\"form-help\">Enter a unique value.</div>\n\n                </div>\n                <div class=\"medium-6 columns\"></div>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"hub\" name=\"hub\" class=\"to-selectize\" type=\"text\" placeholder=\"Choose an option\" data-form=\"package\" required=\"\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"hub"), env.opts.autoescape);
;
}
output += "\" />\n                    <label for=\"hub\" class=\"control-label\">Hub<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n                <div class=\"medium-4 columns form-group\">\n                    <input id=\"type\" name=\"type\" class=\"to-selectize\" type=\"text\" placeholder=\"Choose an option\" data-form=\"primary\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"type"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"type\" class=\"control-label\">Type<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n                <div class=\"medium-2 columns form-group length-group\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"type") == "text") {
output += " style=\"display: block;\"";
;
}
;
}
output += ">\n                    <input id=\"length\" name=\"length\" data-form=\"primary\" class=\"form-select-inches\" type=\"number\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"length")) {
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "formattedLength"), env.opts.autoescape);
;
}
;
}
output += "\" required=\"\" ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"type") != "text") {
output += "disabled=\"\" ";
;
}
;
}
else {
output += "disabled=\"\" ";
;
}
output += "/>\n                    <label for=\"length\" class=\"control-label\">Inches</label>\n                    <i class=\"bar\"></i>\n                </div>\n            </div>\n\n            <div class=\"row\">\n                <!--  -->\n                <div class=\"medium-12 columns form-group\">\n                    <div class=\"expanding-holder";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"budgetLine")) > 0) {
output += " has-value";
;
}
;
}
output += "\">\n                        <textarea id=\"budget_line\" name=\"budget_line\" data-form=\"primary\" rows=\"1\" required=\"\">";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"budgetLine");
if(t_3) {var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("budgetLineGraf", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += runtime.suppressValue(t_4, env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += "<br />";
;
}
;
}
}
frame = frame.pop();
;
}
output += "</textarea>\n                    </div>\n                    <label for=\"budget_line\" class=\"control-label\">Budget line<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n            </div>\n\n            <div class=\"section-header\">\n                <h4>Headline ideas</h4>\n            </div>\n\n            <div class=\"row\">\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                <div class=\"medium-12 columns form-radio\">\n                    ";
;
}
output += "\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines") && runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "finalized") {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline1\" name=\"headline1\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 0) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" readonly=\"\" />\n                    <label for=\"headline1\" class=\"control-label\">Headline #1</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
else {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                        ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 0) {
output += "\n                    <div class=\"radio\">\n                        <label>\n                            <input id=\"headline1\" name=\"headlineChoices\" data-form=\"package\" type=\"radio\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"id"), env.opts.autoescape);
output += "\" /><i class=\"helper\"></i><span class=\"radio-label\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"headline"), env.opts.autoescape);
output += "</span>\n                        </label>\n                    </div>\n                        ";
;
}
output += "\n                    ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline1\" name=\"headline1\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 0) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline1\" class=\"control-label\">Headline #1</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
;
}
output += "\n                ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline1\" name=\"headline1\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 0) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),0)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline1\" class=\"control-label\">Headline #1</label>\n                    <i class=\"bar\"></i>\n                </div>\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines") && runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "finalized") {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline2\" name=\"headline2\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 1) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" readonly=\"\" />\n                    <label for=\"headline2\" class=\"control-label\">Headline #2</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
else {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                        ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 1) {
output += "\n                    <div class=\"radio\">\n                        <label>\n                            <input id=\"headline2\" name=\"headlineChoices\" data-form=\"package\" type=\"radio\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"id"), env.opts.autoescape);
output += "\" /><i class=\"helper\"></i><span class=\"radio-label\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"headline"), env.opts.autoescape);
output += "</span>\n                        </label>\n                    </div>\n                        ";
;
}
output += "\n                    ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline2\" name=\"headline2\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 1) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\">\n                    <label for=\"headline2\" class=\"control-label\">Headline #1</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
;
}
output += "\n                ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline2\" name=\"headline2\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 1) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),1)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\">\n                    <label for=\"headline2\" class=\"control-label\">Headline #1</label>\n                    <i class=\"bar\"></i>\n                </div>\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines") && runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "finalized") {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline3\" name=\"headline3\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 2) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" readonly=\"\" />\n                    <label for=\"headline3\" class=\"control-label\">Headline #3</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
else {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                        ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 2) {
output += "\n                    <div class=\"radio\">\n                        <label>\n                            <input id=\"headline3\" name=\"headlineChoices\" data-form=\"package\" type=\"radio\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"id"), env.opts.autoescape);
output += "\" /><i class=\"helper\"></i><span class=\"radio-label\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"headline"), env.opts.autoescape);
output += "</span>\n                        </label>\n                    </div>\n                        ";
;
}
output += "\n                    ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline3\" name=\"headline3\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 2) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline3\" class=\"control-label\">Headline #4</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
;
}
output += "\n                ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline3\" name=\"headline3\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 2) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),2)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline3\" class=\"control-label\">Headline #2</label>\n                    <i class=\"bar\"></i>\n                </div>\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines") && runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "finalized") {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline4\" name=\"headline4\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 3) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" readonly=\"\" />\n                    <label for=\"headline4\" class=\"control-label\">Headline #3</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
else {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                        ";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 3) {
output += "\n                    <div class=\"radio\">\n                        <label>\n                            <input id=\"headline4\" name=\"headlineChoices\" data-form=\"package\" type=\"radio\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"id"), env.opts.autoescape);
output += "\" /><i class=\"helper\"></i><span class=\"radio-label\">";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"headline"), env.opts.autoescape);
output += "</span>\n                        </label>\n                    </div>\n                        ";
;
}
output += "\n                    ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline4\" name=\"headline4\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 3) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline4\" class=\"control-label\">Headline #4</label>\n                    <i class=\"bar\"></i>\n                </div>\n                    ";
;
}
;
}
output += "\n                ";
;
}
else {
output += "\n                <div class=\"medium-6 columns form-group\">\n                    <input id=\"headline4\" name=\"headline4\" data-form=\"package\" type=\"text\" data-headline-id=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"id"), env.opts.autoescape);
output += "\" value=\"";
if(env.getFilter("length").call(context, runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")) > 3) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"candidates")),3)),"headline"), env.opts.autoescape);
;
}
output += "\" required=\"\" />\n                    <label for=\"headline4\" class=\"control-label\">Headline #3</label>\n                    <i class=\"bar\"></i>\n                </div>\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                    <!-- <div class=\"radio\"> -->\n                        <!-- <label> -->\n                            <!-- <input id=\"headlineOther\" name=\"headlineChoices\" data-form=\"package\" type=\"radio\" value=\"other\" /><i class=\"helper\"></i><span class=\"radio-label\">Other headline</span> -->\n                        <!-- </label> -->\n                    <!-- </div> -->\n                    ";
;
}
output += "\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += "\n                    ";
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "voting") {
output += "\n                </div>\n                    ";
;
}
output += "\n                ";
;
}
output += "\n\n                ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"headlines")),"status") == "drafting") {
output += "\n                <div class=\"medium-12 columns checkbox\">\n                    <label>\n                        <input id=\"headlinesReady\" name=\"headlinesReady\" data-form=\"package\" type=\"checkbox\" value=\"ready\" /><i class=\"helper\"></i>Submit headlines to a vote\n                        <!-- <input type=\"checkbox\" checked=\"\" /><i class=\"helper\"></i>Submit headlines to a vote -->\n                    </label>\n                </div>\n                ";
;
}
;
}
;
}
output += "\n            </div>\n\n            <div class=\"section-header\">\n                <h4>Staff</h4>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"medium-6 columns form-group set-authors\">\n                    <input id=\"authors\" name=\"authors\" class=\"to-selectize staff-select reporter\" data-form=\"primary\" type=\"text\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
frame = frame.push();
var t_7 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"authors");
if(t_7) {var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("author", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += runtime.suppressValue(runtime.memberLookup((t_8),"email"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ",";
;
}
;
}
}
frame = frame.pop();
;
}
output += "\" />\n                    <label for=\"authors\" class=\"control-label\">Author(s)<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n                <div class=\"medium-6 columns form-group set-editors\">\n                    <input id=\"editors\" name=\"editors\" class=\"to-selectize staff-select editor\" data-form=\"primary\" type=\"text\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
frame = frame.push();
var t_11 = runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"primaryContent")),"editors");
if(t_11) {var t_10 = t_11.length;
for(var t_9=0; t_9 < t_11.length; t_9++) {
var t_12 = t_11[t_9];
frame.set("editor", t_12);
frame.set("loop.index", t_9 + 1);
frame.set("loop.index0", t_9);
frame.set("loop.revindex", t_10 - t_9);
frame.set("loop.revindex0", t_10 - t_9 - 1);
frame.set("loop.first", t_9 === 0);
frame.set("loop.last", t_9 === t_10 - 1);
frame.set("loop.length", t_10);
output += runtime.suppressValue(runtime.memberLookup((t_12),"email"), env.opts.autoescape);
if(!runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "loop")),"last")) {
output += ",";
;
}
;
}
}
frame = frame.pop();
;
}
output += "\" />\n                    <label for=\"editors\" class=\"control-label\">Editor(s)</label>\n                    <i class=\"bar\"></i>\n                </div>\n            </div>\n\n            <div class=\"section-header\">\n                <h4>Schedule</h4>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"medium-3 columns form-group\">\n                    <input id=\"pub_date_resolution\" name=\"pub_date_resolution\" class=\"to-selectize\" type=\"text\" placeholder=\"Choose an option\" data-form=\"package\" required=\"\" value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution"), env.opts.autoescape);
;
}
output += "\" />\n                    <label for=\"pub_date_resolution\" class=\"control-label\">Time format<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n                <div class=\"medium-5 columns form-group pub-date-group\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") != "") {
output += " style=\"display: block;\"";
;
}
;
}
output += ">\n                    <input id=\"pub_date\" name=\"pub_date\" data-form=\"package\" type=\"text\" id=\"pubDate\" required=\"\" ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") == "") {
output += "disabled=\"\" ";
;
}
;
}
else {
output += "disabled=\"\" ";
;
}
output += "value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") != "") {
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "formattedPubDate"), env.opts.autoescape);
;
}
;
}
output += "\" />\n                    <label for=\"pub_date\" class=\"control-label\">Published date<span class=\"required-marker\">*</span></label>\n                    <i class=\"bar\"></i>\n                </div>\n                <div class=\"medium-4 columns form-group pub-time-group\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") == "t") {
output += " style=\"display: block;\"";
;
}
;
}
output += ">\n                    <input id=\"pub_time\" name=\"pub_time\" data-form=\"package\" type=\"time\" id=\"pubTime\" ";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") != "t") {
output += "disabled=\"\" ";
;
}
;
}
else {
output += "disabled=\"\" ";
;
}
output += "value=\"";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"pubDate")),"resolution") == "t") {
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "formattedPubTime"), env.opts.autoescape);
;
}
;
}
output += "\" pattern=\"\\d{2}:\\d{2}\" />\n                    <label for=\"pub_time\" class=\"control-label\">Published time&thinsp;*</label>\n                    <i class=\"bar\"></i>\n                </div>\n            </div>\n\n            <div class=\"section-header\">\n                <h4>More information</h4>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"medium-12 columns notes-reveal form-group\">\n                    <div class=\"expanding-holder";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"notes") != "") {
output += " has-value";
;
}
;
}
output += "\">\n                        <textarea id=\"notes\" name=\"notes\" data-form=\"package\" rows=\"4\" required=\"\">";
if(runtime.contextOrFrameLookup(context, frame, "boundData")) {
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "boundData")),"notes"), env.opts.autoescape);
;
}
output += "</textarea>\n                    </div>\n                    <label for=\"notes\" class=\"control-label\">Notes</label>\n                    <i class=\"bar\"></i>\n                </div>\n            </div>\n        </form>\n    </div>\n\n    <div class=\"single-page\">\n        <div id=\"additional-forms\">\n            <div class=\"section-header\">\n                <h4 class=\"final-header\">Additional content <span class=\"add-additional-content-trigger button\"><i class=\"fa fa-plus\"></i><span>&thinsp;Add<span class=\"show-for-medium\">&nbsp;content</span></span></span></h4>\n            </div>\n        </div>\n\n        <div class=\"additional-content\">\n        </div>\n\n        <div class=\"bottom-button-holder\">\n            <div class=\"add-additional-content-trigger button\"><i class=\"fa fa-plus\"></i><span>&thinsp;Add content</span></div>\n        </div>\n    </div>\n</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["packages-list-datefilter"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"icon-holder column small-1 medium-1 large-1\">\n    <i class=\"fa fa-calendar\"></i>\n</div>\n<div class=\"date-chooser-holder column small-5 medium-5 large-5\">\n    <div class=\"\"></div>\n    <div id=\"date-chooser\">\n        <input id=\"budget-dates-start\" size=\"20\" value=\"\" placeholder=\"Start date\">\n        <span class=\"to-label\"> to </span>\n        <input id=\"budget-dates-end\" size=\"20\" value=\"\" placeholder=\"End date\">\n        <div class=\"clearer\"></div>\n    </div>\n    <div class=\"\"></div>\n</div>\n<div class=\"column small-3 medium-3 large-3\">&nbsp;</div>\n<div class=\"create-button column small-3 medium-3 large-3\">\n    <a class=\"button\" href=\"/#edit/\"><span>Create new</span></a>\n</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["packages-list-searchbox"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"icon-holder column small-1 medium-1 large-1\">\n    <i class=\"fa fa-search\"></i>\n</div>\n<div class=\"search-box-holder column small-11 medium-11 large-11\">\n    <div class=\"\">\n        <input id=\"package-search-box\" name=\"package-search-box\" type=\"text\" placeholder=\"Search people, hubs, verticals and story descriptions...\" />\n    </div>\n</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["packages-list"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div id=\"filter-holder\" class=\"center-content row\">\n    <div id=\"date-filter\" class=\"row\"></div>\n    <div id=\"search-box\" class=\"row\"></div>\n</div>\n<div id=\"package-list\" class=\"center-content\">TK.</div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["root-view"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
var parentTemplate = null;
output += "<div id=\"navigation\" class=\"top-bar sans\"></div>\n<div id=\"main-content\"></div>\n<div id=\"modal-holder\" class=\"medium reveal reveal-modal package-modal fast\" data-reveal data-animation-in=\"scale-in-up\" data-animation-out=\"scale-out-down\"></div>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
