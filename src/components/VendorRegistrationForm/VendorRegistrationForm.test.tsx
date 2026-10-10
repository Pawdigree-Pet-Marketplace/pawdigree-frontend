import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import VendorRegistrationForm from "./VendorRegistrationForm";

describe("Vendor Registration Form", () => {
  test("renders the vendor registration heading", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("heading", {
        name: "Become a Pawdigree Vendor",
      })
    ).toBeInTheDocument();
  });

  test("renders the account information fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Phone Number/i)).toBeInTheDocument();
  });

  test("renders both password fields", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByLabelText("Password *")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Confirm Password *")
    ).toBeInTheDocument();
  });

  test("renders business information fields", () => {
    render(<VendorRegistrationForm />);

    expect(screen.getByLabelText(/^Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Business Type/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^Business Description/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^Business Address/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^District/i)).toBeInTheDocument();
  });

  test("renders the vendor account submit button", () => {
    render(<VendorRegistrationForm />);

    expect(
      screen.getByRole("button", {
        name: "Create Vendor Account",
      })
    ).toBeInTheDocument();
  });
});
