import { render, fireEvent } from '@testing-library/react-native';

import { AppButton } from '../AppButton';

describe('AppButton', () => {
  it('renders the label and calls onPress', () => {
    const onPress = jest.fn();

    const { getByText } = render(<AppButton label="Start" onPress={onPress} />);

    fireEvent.press(getByText('Start'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

