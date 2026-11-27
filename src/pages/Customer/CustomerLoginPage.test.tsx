import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CustomerLoginPage from "./CustomerLoginPage";

function DestinationProbe() {
  const location = useLocation();
  return <output data-testid="registration-state">{JSON.stringify(location.state)}</output>;
}

describe("customer login registration link", () => {
  it("preserves a cart or checkout destination when proceeding to registration", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/customer/checkout" } } }]}>
        <Routes>
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/registration" element={<DestinationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    expect(screen.getByTestId("registration-state")).toHaveTextContent('"pathname":"/customer/checkout"');
  });
});
