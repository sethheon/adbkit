var Command,
  LineTransform,
  Parser,
  Promise,
  Protocol,
  ScreenrecordCommand,
  extend = function(child, parent) {
    for (var key in parent) {
      if (hasProp.call(parent, key)) child[key] = parent[key];
    }
    function ctor() {
      this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
  },
  hasProp = {}.hasOwnProperty;

Promise = require("bluebird");

Command = require("../../command");

Protocol = require("../../protocol");

Parser = require("../../parser");

LineTransform = require("../../linetransform");

ScreenrecordCommand = (function(superClass) {
  extend(ScreenrecordCommand, superClass);

  function ScreenrecordCommand() {
    return ScreenrecordCommand.__super__.constructor.apply(this, arguments);
  }

  ScreenrecordCommand.prototype.execute = function({
    size = "720x480",
    bitRate = "16m",
    timeLimit = 180
  } = {}) {
    let shellCommand = "shell:echo && screenrecord --output-format=h264";
    shellCommand += " --size=" + size;
    shellCommand += " --bit-rate=" + bitRate;
    shellCommand += " --time-limit=" + timeLimit;
    shellCommand += " - 2>/dev/null";

    this._send(shellCommand);
    return this.parser.readAscii(4).then(
      (function(_this) {
        return function(reply) {
          var transform;
          switch (reply) {
            case Protocol.OKAY:
              transform = new LineTransform();
              return _this.parser
                .readBytes(1)
                .then(function(chunk) {
                  transform = new LineTransform({
                    autoDetect: true
                  });
                  transform.write(chunk);
                  return _this.parser.raw().pipe(transform);
                })
                ["catch"](Parser.PrematureEOFError, function() {
                  throw new Error("No support for the screenrecord command");
                });
            case Protocol.FAIL:
              return _this.parser.readError();
            default:
              return _this.parser.unexpected(reply, "OKAY or FAIL");
          }
        };
      })(this)
    );
  };

  return ScreenrecordCommand;
})(Command);

module.exports = ScreenrecordCommand;
