import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";
import { registerUser } from "@/lib/auth";

const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock("@/lib/auth", () => ({
  login: jest.fn(),
  registerUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends the emergency contact when registering as an adult", async () => {
    const user = userEvent.setup();
    (registerUser as jest.Mock).mockResolvedValueOnce(undefined);

    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nom"), "Martin");
    await user.type(screen.getByLabelText("Prénom"), "Alex");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1234!");
    await user.type(screen.getByLabelText("Confirmer"), "Password1234!");
    await user.type(screen.getByLabelText("Date de naissance"), "1992-01-01");
    await user.type(screen.getByLabelText("Nom du responsable"), "Durand");
    await user.type(screen.getByLabelText("Prénom du responsable"), "Paul");
    await user.type(
      screen.getByLabelText("Email du responsable"),
      "paul@example.com",
    );
    await user.type(
      screen.getByLabelText("Téléphone du responsable"),
      "0600000000",
    );
    await user.click(screen.getByRole("button", { name: "Créer un compte" }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        firstname: "Alex",
        lastname: "Martin",
        email: "alex@example.com",
        password: "Password1234!",
        dateOfBirth: "1992-01-01",
        emergencyContact: JSON.stringify({
          lastname: "Durand",
          firstname: "Paul",
          email: "paul@example.com",
          phone: "0600000000",
        }),
        pseudo: undefined,
        phone: undefined,
      });
    });
  });
});
