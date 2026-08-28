import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";
import { login, registerUser } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-api";

const push = jest.fn();
const refresh = jest.fn();
const getSearchParam = jest.fn(() => null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
  useSearchParams: () => ({
    get: getSearchParam,
  }),
}));

jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth");
  return {
    ...actual,
    login: jest.fn(),
    registerUser: jest.fn(),
  };
});

jest.mock("@/lib/user-api", () => ({
  getCurrentUser: jest.fn(),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSearchParam.mockReturnValue(null);
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
    expect(registerUser).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Valider votre adresse e-mail" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Recevoir le lien de validation" }),
    );

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

  it("does not create an account when registration is cancelled", async () => {
    const user = userEvent.setup();

    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nom"), "Martin");
    await user.type(screen.getByLabelText("Prénom"), "Alex");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1234!");
    await user.type(screen.getByLabelText("Confirmer"), "Password1234!");
    await user.type(screen.getByLabelText("Date de naissance"), "1992-01-01");
    await user.click(screen.getByRole("button", { name: "Créer un compte" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(registerUser).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prefills email in login mode from query string", async () => {
    getSearchParam.mockImplementation((name: string) =>
      name === "email" ? "prefilled@example.com" : null,
    );

    render(<AuthForm mode="login" />);

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toHaveValue(
        "prefilled@example.com",
      );
    });
  });

  it("redirects organizer to admin after successful login", async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockResolvedValueOnce("");
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({
      role: "ROLE_ORGANIZER",
    });

    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "orga@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1234!");
    await user.click(screen.getByRole("button", { name: "Connexion" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "orga@example.com",
        password: "Password1234!",
      });
      expect(push).toHaveBeenCalledWith("/admin");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Connexion réussie.",
      );
    });
  });

  it("shows authentication error when login fails", async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockRejectedValueOnce(
      new Error("Identifiants invalides."),
    );

    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "bad-password");
    await user.click(screen.getByRole("button", { name: "Connexion" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Identifiants invalides.",
      );
    });
  });

  it("shows validation summary for minor registration without guardian fields", async () => {
    const user = userEvent.setup();

    render(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nom"), "Martin");
    await user.type(screen.getByLabelText("Prénom"), "Alex");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1234!");
    await user.type(screen.getByLabelText("Confirmer"), "Password1234!");
    await user.type(screen.getByLabelText("Date de naissance"), "2012-01-01");
    await user.click(screen.getByRole("button", { name: "Créer un compte" }));

    await waitFor(() => {
      expect(
        screen.getByText("Veuillez corriger les erreurs du formulaire."),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Nom du responsable requis").length).toBe(2);
      expect(screen.getAllByText("Prénom du responsable requis").length).toBe(
        2,
      );
      expect(screen.getAllByText("Email du responsable requis").length).toBe(2);
      expect(
        screen.getAllByText("Téléphone du responsable requis").length,
      ).toBe(2);
      expect(registerUser).not.toHaveBeenCalled();
    });
  });
});
