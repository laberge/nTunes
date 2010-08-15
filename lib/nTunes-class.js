var sys = require("sys");

// Represents one iTunes AppleScript "class".
function nClass(clazz) {
  this.name = clazz['@'].name;
  this.description = clazz['@'].description;
  this.inherits = clazz['@'].inherits;
  this.plural = clazz['@'].plural;
  this.contains = [];
  this.properties = [];
  this.subclasses = [];
  
  if (clazz.element) {
    if (Array.isArray(clazz.element)) {
      clazz.element.forEach(function(element) {
        this.contains.push(element['@'].type);
      }, this);
    } else {
      this.contains.push(clazz.element['@'].type);
    }
  }

  if (clazz.property) {
    if (Array.isArray(clazz.property)) {
      clazz.property.forEach(function(property) {
        this.properties.push(nClass.createPropObj(property));
      }, this);
    } else {
      this.properties.push(nClass.createPropObj(clazz.property));
    }
  }
}

nClass.prototype.hasElement = function(element) {
  return this.contains.indexOf(element) >= 0;
}

nClass.prototype.hasDirectProperty = function(prop) {
  for (var i=0, l=this.properties.length; i<l; i++) {
    if (this.properties[i].name == prop) return true;
  }
  return false;
}

nClass.prototype.hasProperty = function(prop) {
  for (var i=0, l=this.properties.length; i<l; i++) {
    if (this.properties[i].name == prop) return true;
  }
  var parent = this.parent;
  while (parent) {
    if (parent.hasDirectProperty(prop)) {
      return true;
    } else {
      parent = parent.parent;
    }
  }
  for (var i=0, l=this.subclasses.length; i<l; i++) {
    if (this.subclasses[i].hasDirectProperty(prop)) return true;
  }
  return false;
}

nClass.prototype.getProperty = function(prop) {
  for (var i=0, l=this.properties.length; i<l; i++) {
    if (this.properties[i].name == prop) return this.properties[i];
  }
  var parent = this.parent;
  while (parent) {
    if (parent.hasDirectProperty(prop)) {
      return parent.getProperty(prop);
    } else {
      parent = parent.parent;
    }
  }
}


nClass.prototype.getAllPropertyNames = function(prop) {
  var obj = this, rtn = [];
  while (obj) {
    for (var i=0; i<obj.properties.length; i++) {
      rtn.push(obj.properties[i].name);
    }
    obj = obj.parent;
  }
}

var classes = {};
nClass.processClasses = function(list) {
  for (var i=0, l=list.length; i<l; i++) {
    var c = new nClass(list[i]);
    classes[c.name] = c;
  }
  for (var i in classes) {
    var c = classes[i];
    if (c.inherits) {
      var parent = classes[c.inherits];
      c.parent = parent;
      parent.subclasses.push(c);
    }
  }
  
  return classes;
}

nClass.getClass = function(clazz) {
  return classes[clazz];
}

nClass.createPropObj = function(prop) {
  return {
    name: prop['@'].name,
    type: prop['@'].type,
    description: prop['@'].description
  };
}

module.exports = nClass;