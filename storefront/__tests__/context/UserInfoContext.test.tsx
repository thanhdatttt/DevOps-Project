import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { UserInfoProvider, useUserInfoContext } from 'context/UserInfoContext';
import * as ProfileService from 'modules/profile/services/ProfileService';

jest.mock('modules/profile/services/ProfileService');
const mockGetMyProfile = ProfileService.getMyProfile as jest.MockedFunction<
  typeof ProfileService.getMyProfile
>;

const TestConsumer = () => {
  const { firstName, lastName, email, fetchUserInfo } = useUserInfoContext();
  return (
    <div>
      <span data-testid="firstName">{firstName}</span>
      <span data-testid="lastName">{lastName}</span>
      <span data-testid="email">{email}</span>
      <button onClick={fetchUserInfo}>Reload</button>
    </div>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UserInfoContext', () => {
  it('provides empty strings as defaults', () => {
    mockGetMyProfile.mockResolvedValue({ firstName: '', lastName: '', email: '' });
    render(
      <UserInfoProvider>
        <TestConsumer />
      </UserInfoProvider>
    );
    expect(screen.getByTestId('firstName')).toHaveTextContent('');
    expect(screen.getByTestId('lastName')).toHaveTextContent('');
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });

  it('fetches and displays user info on mount', async () => {
    mockGetMyProfile.mockResolvedValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });

    render(
      <UserInfoProvider>
        <TestConsumer />
      </UserInfoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('firstName')).toHaveTextContent('John');
      expect(screen.getByTestId('lastName')).toHaveTextContent('Doe');
      expect(screen.getByTestId('email')).toHaveTextContent('john@example.com');
    });
  });

  it('handles fetch error gracefully', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('Unauthorized'));
    render(
      <UserInfoProvider>
        <TestConsumer />
      </UserInfoProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('firstName')).toHaveTextContent('');
    });
  });

  it('refetches when fetchUserInfo is called', async () => {
    mockGetMyProfile
      .mockResolvedValueOnce({ firstName: 'Alice', lastName: 'A', email: 'alice@a.com' })
      .mockResolvedValueOnce({ firstName: 'Bob', lastName: 'B', email: 'bob@b.com' });

    render(
      <UserInfoProvider>
        <TestConsumer />
      </UserInfoProvider>
    );

    await waitFor(() => expect(screen.getByTestId('firstName')).toHaveTextContent('Alice'));

    await act(async () => {
      screen.getByText('Reload').click();
    });

    await waitFor(() => expect(screen.getByTestId('firstName')).toHaveTextContent('Bob'));
  });
});

describe('useUserInfoContext default', () => {
  it('returns default context values outside provider', () => {
    const TestDefault = () => {
      const { firstName, lastName, email } = useUserInfoContext();
      return (
        <div>
          <span data-testid="fn">{firstName}</span>
          <span data-testid="ln">{lastName}</span>
          <span data-testid="em">{email}</span>
        </div>
      );
    };
    render(<TestDefault />);
    expect(screen.getByTestId('fn')).toHaveTextContent('');
    expect(screen.getByTestId('ln')).toHaveTextContent('');
    expect(screen.getByTestId('em')).toHaveTextContent('');
  });
});
