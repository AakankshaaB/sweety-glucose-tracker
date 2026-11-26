import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../components/ReadingForm';

describe('ReadingForm', () => {
  const today = '2026-10-15';

  test('shows error when glucose value is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ReadingForm onSave={onSave} today={today} />);

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a glucose value.'
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  test('shows error when value is outside 40 to 600', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ReadingForm onSave={onSave} today={today} />);

    await user.type(screen.getByLabelText(/glucose/i), '30');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  test('shows error when selected date is in the future', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ReadingForm onSave={onSave} today={today} />);

    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-10-16');
    await user.type(screen.getByLabelText(/glucose/i), '120');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Date cannot be in the future.'
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  test('submits valid reading and shows server errors if rejected', async () => {
    const user = userEvent.setup();
    const onSave = vi
      .fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(
        new Error('You already have an After lunch reading for this date.')
      );

    render(<ReadingForm onSave={onSave} today={today} />);

    await user.selectOptions(screen.getByLabelText(/time slot/i), 'After lunch');
    await user.type(screen.getByLabelText(/glucose/i), '145');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(onSave).toHaveBeenCalledWith({
      readingDate: '2026-10-15',
      timeSlot: 'After lunch',
      value: 145,
    });

    await user.type(screen.getByLabelText(/glucose/i), '150');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.'
    );
  });
});
