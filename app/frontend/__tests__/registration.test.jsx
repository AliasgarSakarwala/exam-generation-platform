import React, { Suspense } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import Auth from 'app/auth/[mode]/page'


jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),    // no-op push()
  }),
}))

describe('Auth (async params)', () => {
  const modes = ['register', 'login', 'reset-password'];

  modes.forEach((mode) => {
    it(`renders the ${mode} screen`, async () => {
      await act(async () => {
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <Auth params={Promise.resolve({ mode })} />
          </Suspense>
        )
      })

      switch (mode) {
        case 'register': {
          // verify the header text
          const textValue = await screen.getByText("Create Your Account");
          expect(textValue).toBeInTheDocument();

          // renders the CT3 logo
          const logo = screen.getByAltText(/ct3 logo/i);
          expect(logo).toBeInTheDocument();

          // renders the main heading
          const heading = screen.getByRole("heading", {
            level: 1,
            name: /exam generation and analysis system/i,
          });
          expect(heading).toBeInTheDocument();

          // renders all three input fields
          const emailInput = screen.getByTestId("email--input");
          const passwordInput = screen.getByTestId("password--input");
          const confirmPasswordInput = screen.getByTestId("confirmPassword--input");
          expect(emailInput).toBeInTheDocument();
          expect(passwordInput).toBeInTheDocument();
          expect(confirmPasswordInput).toBeInTheDocument();

          // keeps password fields obscured
          expect(passwordInput).toHaveAttribute("type", "password");
          expect(confirmPasswordInput).toHaveAttribute("type", "password");

          //Validation Checks

          let confirmPasswordErrText;
          let passwordErrText;

          // requires all fields to be filled
          const submitBtn = screen.getByTestId("register--submit");
          await userEvent.click(submitBtn);
          const emailErrText = screen.getByTestId("email--error");
          passwordErrText = screen.getByTestId("password--error");
          confirmPasswordErrText = screen.getByTestId("confirmPassword--error");
          expect(emailErrText).toBeInTheDocument();
          expect(passwordErrText).toBeInTheDocument();
          expect(confirmPasswordErrText).toBeInTheDocument();

          // Passwords do not match
          await userEvent.type(emailInput, "john@example.com");
          await userEvent.type(passwordInput, "password");
          await userEvent.type(confirmPasswordInput, "different--password");
          await userEvent.click(submitBtn);
          passwordErrText = screen.getByTestId("password--error");
          confirmPasswordErrText = screen.getByTestId("confirmPassword--error");
          expect(passwordErrText).toBeInTheDocument();
          expect(confirmPasswordErrText).toBeInTheDocument();

          // Password Helper
          const passwordHelper = screen.getByTestId("password--helper");
          expect(passwordHelper).toBeInTheDocument();

          const passwordHelperInstructions = screen.getAllByTestId("password--helper--instruction");
          expect(passwordHelperInstructions).toHaveLength(4);

          await userEvent.type(passwordInput, "Password123");
          const instructionTexts = screen.getAllByTestId("password--helper--instruction--text");
          for (let i = 0; i < instructionTexts.length; i++) {
            expect(instructionTexts[i]).toHaveClass("text-[#00a100]");
          }

          break;
        }
        case 'login': {
          const textValue = await screen.getByText("Sign In to your account");
          expect(textValue).toBeInTheDocument();
          break;
        }
        case 'reset-password': {
          const textValue = await screen.getByText("Reset Password");
          expect(textValue).toBeInTheDocument();

          // renders the reset password info
          const resetPasswordInfo = screen.getByTestId("reset-password--info");
          expect(resetPasswordInfo).toBeInTheDocument();

          // requires email to be filled
          const submitBtn = screen.getByTestId("reset-password--submit");
          await userEvent.click(submitBtn);
          const emailErrText = screen.getByTestId("email--error");
          expect(emailErrText).toBeInTheDocument();

          break;
        }
        default: {
          fail("Invalid Mode for the Auth Page");
        }
      }
    })
  })
})