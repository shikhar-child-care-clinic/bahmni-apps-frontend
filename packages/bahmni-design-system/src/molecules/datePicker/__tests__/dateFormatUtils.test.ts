import {
  getBrowserLocaleDateFormat,
  convertToFlatpickrFormat,
  getDateFormats,
  DEFAULT_DATE_FORMAT,
} from '../dateFormatUtils';

describe('dateFormatUtils', () => {
  describe('getBrowserLocaleDateFormat', () => {
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    });

    it.each([
      ['en-US', 'MM/dd/yyyy'],
      ['ja-JP', 'yyyy-MM-dd'],
      ['ko-KR', 'yyyy-MM-dd'],
      ['zh-CN', 'yyyy-MM-dd'],
      ['vi-VN', 'yyyy-MM-dd'],
    ])('returns correct format for %s locale', (language, expectedFormat) => {
      Object.defineProperty(global, 'navigator', {
        value: { language },
        configurable: true,
        writable: true,
      });

      expect(getBrowserLocaleDateFormat()).toBe(expectedFormat);
    });

    it.each([
      ['en-GB', DEFAULT_DATE_FORMAT],
      ['de-DE', DEFAULT_DATE_FORMAT],
      ['fr-FR', DEFAULT_DATE_FORMAT],
    ])('returns default format for %s locale', (language, expectedFormat) => {
      Object.defineProperty(global, 'navigator', {
        value: { language },
        configurable: true,
        writable: true,
      });

      expect(getBrowserLocaleDateFormat()).toBe(expectedFormat);
    });

    it.each([
      [
        'window is undefined',
        { window: undefined, navigator: originalNavigator },
      ],
      [
        'navigator is undefined',
        { window: originalWindow, navigator: undefined },
      ],
      [
        'navigator.language is empty',
        { window: originalWindow, navigator: { language: '' } },
      ],
    ])(
      'returns default format when %s',
      (description, { window: mockWindow, navigator: mockNavigator }) => {
        if (mockWindow === undefined) {
          Object.defineProperty(global, 'window', {
            value: mockWindow,
            configurable: true,
            writable: true,
          });
        }

        Object.defineProperty(global, 'navigator', {
          value: mockNavigator,
          configurable: true,
          writable: true,
        });

        expect(getBrowserLocaleDateFormat()).toBe(DEFAULT_DATE_FORMAT);
      },
    );

    it('returns default format when an error occurs', () => {
      Object.defineProperty(global, 'navigator', {
        get() {
          throw new Error('Navigator access error');
        },
        configurable: true,
      });

      expect(getBrowserLocaleDateFormat()).toBe(DEFAULT_DATE_FORMAT);
    });
  });

  describe('convertToFlatpickrFormat', () => {
    it.each([
      ['dd/MM/yyyy', 'd/m/Y'],
      ['MM/dd/yyyy', 'm/d/Y'],
      ['yyyy-MM-dd', 'Y-m-d'],
      ['dd-MM-yyyy', 'd-m-Y'],
      ['dd.MM.yyyy', 'd.m.Y'],
      ['dd MM yyyy', 'd m Y'],
      ['dd-MMM-yyyy', 'd-M-Y'],
      ['dd/MMM/yyyy', 'd/M/Y'],
      ['dd MMM yyyy', 'd M Y'],
      ['dd-MMMM-yyyy', 'd-F-Y'],
      ['dd/MMMM/yyyy', 'd/F/Y'],
      ['dd MMMM yyyy', 'd F Y'],
      ['MMMM dd, yyyy', 'F d, Y'],
      ['MMM dd, yyyy', 'M d, Y'],
      ['d/M/yyyy', 'j/n/Y'],
      ['d-M-yyyy', 'j-n-Y'],
      ['M/d/yyyy', 'n/j/Y'],
      ['M-d-yyyy', 'n-j-Y'],
      ['dd/MM/yy', 'd/m/y'],
      ['dd-MM-yy', 'd-m-y'],
      ['MM/dd/yy', 'm/d/y'],
      ['MM-dd-yy', 'm-d-y'],
      ['yy-MM-dd', 'y-m-d'],
      ['yyyy/MM/dd', 'Y/m/d'],
      ['yyyy-MMM-dd', 'Y-M-d'],
      ['do MMM, yyyy', 'jS M, Y'],
    ])('converts %s to flatpickr format %s', (input, expected) => {
      expect(convertToFlatpickrFormat(input)).toBe(expected);
    });

    it('returns original format when format is not in mapping', () => {
      const customFormat = 'custom-format';
      expect(convertToFlatpickrFormat(customFormat)).toBe(customFormat);
    });
  });

  describe('getDateFormats', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('returns both dateFnsFormat and flatpickrFormat', () => {
      const formats = getDateFormats();

      expect(formats).toHaveProperty('dateFnsFormat');
      expect(formats).toHaveProperty('flatpickrFormat');
      expect(typeof formats.dateFnsFormat).toBe('string');
      expect(typeof formats.flatpickrFormat).toBe('string');
    });

    it.each([
      ['MM/dd/yyyy', 'm/d/Y'],
      ['yyyy-MM-dd', 'Y-m-d'],
      ['dd-MMM-yyyy', 'd-M-Y'],
      ['dd/MM/yyyy', 'd/m/Y'],
    ])(
      'uses localStorage format %s and converts to %s',
      (dateFnsFormat, flatpickrFormat) => {
        localStorage.setItem('default_dateFormat', dateFnsFormat);

        const formats = getDateFormats();

        expect(formats.dateFnsFormat).toBe(dateFnsFormat);
        expect(formats.flatpickrFormat).toBe(flatpickrFormat);
      },
    );

    it('falls back to browser locale when localStorage is empty', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' },
        configurable: true,
        writable: true,
      });

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBe('MM/dd/yyyy');
      expect(formats.flatpickrFormat).toBe('m/d/Y');
    });

    it('handles localStorage error gracefully', () => {
      const getItemSpy = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('localStorage error');
        });

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBeDefined();
      expect(formats.flatpickrFormat).toBeDefined();

      getItemSpy.mockRestore();
    });

    it('uses unmapped format as-is for flatpickr when not in mapping', () => {
      const customFormat = 'custom-unmapped-format';
      localStorage.setItem('default_dateFormat', customFormat);

      const formats = getDateFormats();

      expect(formats.dateFnsFormat).toBe(customFormat);
      expect(formats.flatpickrFormat).toBe(customFormat);
    });
  });

  describe('DEFAULT_DATE_FORMAT', () => {
    it('exports DEFAULT_DATE_FORMAT constant', () => {
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    });
  });
});
