import { fireEvent, render } from '@testing-library/react-native';

import { DurationPresetPicker } from '../DurationPresetPicker';

describe('DurationPresetPicker', () => {
  it('renders the duration options', () => {
    const { getByText } = render(<DurationPresetPicker value={60} onChange={jest.fn()} />);

    expect(getByText('30 min')).toBeTruthy();
    expect(getByText('60 min')).toBeTruthy();
    expect(getByText('90 min')).toBeTruthy();
  });

  it.each([
    [30, 60],
    [60, 30],
    [90, 60],
  ] as const)('calls onChange with %i when pressing %i min', (expected, initialValue) => {
    const onChange = jest.fn();
    const { getByText } = render(<DurationPresetPicker value={initialValue} onChange={onChange} />);

    fireEvent.press(getByText(`${expected} min`));

    expect(onChange).toHaveBeenCalledWith(expected);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('marks the current value as selected and others as not selected', () => {
    const { getByRole } = render(<DurationPresetPicker value={60} onChange={jest.fn()} />);

    expect(getByRole('button', { name: '30 min' }).props.accessibilityState).toMatchObject({ selected: false });
    expect(getByRole('button', { name: '60 min' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(getByRole('button', { name: '90 min' }).props.accessibilityState).toMatchObject({ selected: false });
  });

  it('does not call onChange when disabled', () => {
    const onChange = jest.fn();
    const { getByText } = render(<DurationPresetPicker value={60} onChange={onChange} disabled />);

    fireEvent.press(getByText('30 min'));
    fireEvent.press(getByText('60 min'));
    fireEvent.press(getByText('90 min'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
