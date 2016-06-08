describe('writeHtml', function() {
  var injectWriteHtml = require('inject!../writeHtml');
  var writeHtml;

  describe('before DOMContentLoaded was fired', function() {
    beforeAll(function() {
      writeHtml = injectWriteHtml({
        './hasDomContentLoaded': jasmine.createSpy().and.returnValue(false)
      });
    });

    it('should write content in the page', function() {
      spyOn(document, 'write');

      writeHtml('<span></span>');
      expect(document.write).toHaveBeenCalledWith('<span></span>');
    });
  });

  describe('after DOMContentLoaded was fired', function() {
    beforeAll(function() {
      writeHtml = injectWriteHtml({
        './hasDomContentLoaded': jasmine.createSpy().and.returnValue(true),
        './logger': jasmine.createSpyObj('logger', ['error'])
      });
    });

    it('should not call `document.write`', function() {
      spyOn(document, 'write');

      writeHtml('<span></span>');
      expect(document.write).not.toHaveBeenCalled();
    });
  });

  describe('when `document.write` method is missing', function() {
    var originalDocumentWrite = document.write;
    var loggerSpy = jasmine.createSpyObj('logger', ['error']);

    beforeAll(function() {
      writeHtml = injectWriteHtml({
        './logger': loggerSpy
      });

      document.write = undefined;
    });

    afterAll(function() {
      document.write = originalDocumentWrite;
    });

    it('should log an error message', function() {
      writeHtml('<span></span>');
      expect(loggerSpy.error).toHaveBeenCalled();
    });
  });
});