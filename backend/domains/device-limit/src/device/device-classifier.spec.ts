import { classifyDevice } from './device-classifier';

describe('classifyDevice', () => {
  it('Mac thật: UA Macintosh, touch 0, màn 1440 -> desktop', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Safari/605.1.15';
    expect(classifyDevice(ua, 0, 1440)).toBe('desktop');
  });

  it('iPhone thường: UA iPhone + Mobile/, touch 5, màn 390 -> mobile', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1';
    expect(classifyDevice(ua, 5, 390)).toBe('mobile');
  });

  it('iPhone bật desktop mode: UA Macintosh, touch 5, màn 390 -> mobile', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15';
    expect(classifyDevice(ua, 5, 390)).toBe('mobile');
  });

  it('iPad bật desktop mode: UA Macintosh, touch 5, màn 1024 -> tablet', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15';
    expect(classifyDevice(ua, 5, 1024)).toBe('tablet');
  });

  it('iPad UA thường: UA chứa iPad, touch 5, màn 1024 -> tablet', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(classifyDevice(ua, 5, 1024)).toBe('tablet');
  });

  it('UA trống: "", touch 0, màn 0 -> desktop (không throw)', () => {
    expect(() => classifyDevice('', 0, 0)).not.toThrow();
    expect(classifyDevice('', 0, 0)).toBe('desktop');
  });
});
