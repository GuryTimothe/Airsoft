import { fireEvent, render, screen } from "@testing-library/react";
import UserTable from "./UserTable";
import { type User } from "@/lib/user-api";

const users: User[] = [
  {
    id: 1,
    lastname: "Martin",
    firstname: "Alex",
    email: "alex@example.com",
    dateOfBirth: "1992-01-01",
    role: "ROLE_ADMIN",
    canSeePrivate: true,
  },
  {
    id: 2,
    lastname: "Durand",
    firstname: "Lucas",
    email: "lucas@example.com",
    dateOfBirth: "1990-02-14",
    role: "ROLE_USER",
    canSeePrivate: false,
  },
  {
    id: 3,
    lastname: "Roux",
    firstname: "Nina",
    email: "nina@example.com",
    dateOfBirth: "1995-04-20",
    role: "ROLE_ORGANIZER",
    canSeePrivate: true,
  },
];

describe("UserTable", () => {
  it("renders users and filters them by role and private access", () => {
    render(<UserTable initialUsers={users} />);

    expect(screen.getByText("Alex Martin")).toBeInTheDocument();
    expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
    expect(screen.getByText("Nina Roux")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "ROLE_ADMIN" },
    });

    expect(screen.getByText("Alex Martin")).toBeInTheDocument();
    expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
    expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "all" },
    });

    fireEvent.change(screen.getByLabelText("Filtrer par acces prive"), {
      target: { value: "no" },
    });

    expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
    expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
    expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();
  });
});
