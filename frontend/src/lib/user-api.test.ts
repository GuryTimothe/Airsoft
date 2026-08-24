import {
  deleteCurrentUser,
  createUser,
  deleteUser,
  getCurrentUser,
  getUser,
  getUsers,
  updateMyEmail,
  updateMyPassword,
  updateMyProfile,
  updateUser,
} from "./user-api";

describe("user-api", () => {
  let fetchMock: jest.Mock;
  const mockCsrf = () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ csrfToken: "csrf-token" }),
    });
  };

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps users from hydra:member", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "hydra:member": [
          {
            id: 1,
            lastname: "Martin",
            firstname: "Alex",
            email: "alex@example.com",
            dateOfBirth: "1992-01-01",
            emergencyContact: {
              lastname: "Parent",
              firstname: "Alex",
              email: "parent@example.com",
              phone: "0600000000",
            },
            role: "ROLE_ADMIN",
            canSeePrivate: true,
          },
        ],
      }),
    });

    const result = await getUsers();

    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toMatchObject({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      emergencyContact: {
        lastname: "Parent",
        firstname: "Alex",
        email: "parent@example.com",
        phone: "0600000000",
      },
      role: "ROLE_ADMIN",
      canSeePrivate: true,
    });
  });

  it("maps can_see_private from API responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        lastname: "Durand",
        firstname: "Lucas",
        email: "lucas@example.com",
        dateOfBirth: "1990-02-14",
        role: "ROLE_USER",
        can_see_private: true,
      }),
    });

    const user = await getUser(2);

    expect(user.canSeePrivate).toBe(true);
  });

  it("maps CanSeePrivate from API responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 21,
        lastname: "Dupont",
        firstname: "Marie",
        email: "marie@example.com",
        dateOfBirth: "1991-03-04",
        role: "ROLE_USER",
        CanSeePrivate: true,
      }),
    });

    const user = await getUser(21);

    expect(user.canSeePrivate).toBe(true);
  });

  it("respects backend canSeePrivate value even for elevated roles", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 22,
        lastname: "Role",
        firstname: "Forced",
        email: "forced@example.com",
        dateOfBirth: "1992-05-12",
        role: "ROLE_ADMIN",
        canSeePrivate: false,
      }),
    });

    const user = await getUser(22);

    expect(user.role).toBe("ROLE_ADMIN");
    expect(user.canSeePrivate).toBe(false);
  });

  it("gets a single user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        lastname: "Durand",
        firstname: "Lucas",
        email: "lucas@example.com",
        dateOfBirth: "1990-02-14",
        role: "ROLE_USER",
        canSeePrivate: false,
      }),
    });

    const user = await getUser(2);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/2"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(user.firstname).toBe("Lucas");
  });

  it("maps emergency contact from flattened user payload fields", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 5,
        lastname: "Bernard",
        firstname: "Zoé",
        email: "zoe@example.com",
        dateOfBirth: "2008-06-30",
        emergencyContact: "/api/emergency_contacts/2",
        emergencyContactLastname: "Bernard",
        emergencyContactFirstname: "Marie",
        emergencyContactEmail: "marie@example.com",
        emergencyContactPhone: "0700000000",
        role: "ROLE_USER",
        canSeePrivate: false,
      }),
    });

    const user = await getUser(5);

    expect(user.emergencyContact).toEqual({
      lastname: "Bernard",
      firstname: "Marie",
      email: "marie@example.com",
      phone: "0700000000",
    });
  });

  it("gets current user from /api/me", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 9,
        lastname: "Bernard",
        firstname: "Lina",
        email: "lina@example.com",
        dateOfBirth: "1994-09-03",
        emergencyContact: {
          lastname: "Bernard",
          firstname: "Marie",
          email: "marie@example.com",
          phone: "0700000000",
        },
        role: "ROLE_USER",
        canSeePrivate: false,
      }),
    });

    const user = await getCurrentUser();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(user.role).toBe("ROLE_USER");
    expect(user.emergencyContact).toEqual({
      lastname: "Bernard",
      firstname: "Marie",
      email: "marie@example.com",
      phone: "0700000000",
    });
  });

  it("creates a user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 3,
        lastname: "Roux",
        firstname: "Nina",
        email: "nina@example.com",
        dateOfBirth: "1995-04-20",
        role: "ROLE_USER",
        canSeePrivate: false,
      }),
    });

    const user = await createUser({
      lastname: "Roux",
      firstname: "Nina",
      email: "nina@example.com",
      password: "Password1234!",
      dateOfBirth: "1995-04-20",
      role: "ROLE_USER",
      canSeePrivate: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(user.id).toBe(3);
  });

  it("sends canSeePrivate when creating a user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 13,
        lastname: "Lemoine",
        firstname: "Nora",
        email: "nora@example.com",
        dateOfBirth: "1996-03-08",
        role: "ROLE_ORGANIZER",
        canSeePrivate: true,
      }),
    });

    await createUser({
      lastname: "Lemoine",
      firstname: "Nora",
      email: "nora@example.com",
      password: "Password1234!",
      dateOfBirth: "1996-03-08",
      role: "ROLE_ORGANIZER",
      canSeePrivate: true,
    });

    const [, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(options.body));

    expect(body.canSeePrivate).toBe(true);
    expect(body.can_see_private).toBeUndefined();
  });

  it("updates a user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 4,
        lastname: "Petit",
        firstname: "Emma",
        email: "emma@example.com",
        dateOfBirth: "1998-07-11",
        role: "ROLE_ADMIN",
        canSeePrivate: true,
      }),
    });

    const user = await updateUser(4, {
      role: "ROLE_ADMIN",
      canSeePrivate: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/4"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(user.role).toBe("ROLE_ADMIN");
  });

  it("sends canSeePrivate when updating a user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 14,
        lastname: "Petit",
        firstname: "Emma",
        email: "emma@example.com",
        dateOfBirth: "1998-07-11",
        role: "ROLE_USER",
        canSeePrivate: true,
      }),
    });

    await updateUser(14, {
      canSeePrivate: true,
    });

    const [, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(options.body));

    expect(body.canSeePrivate).toBe(true);
    expect(body.can_see_private).toBeUndefined();
  });

  it("deletes a user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({ ok: true });

    await deleteUser(8);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/8"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("deletes the current user from /api/me", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({ ok: true });

    await deleteCurrentUser();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("updates current user general profile without password", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 12,
        lastname: "Martin",
        firstname: "Alex",
        email: "alex@example.com",
        dateOfBirth: "1992-01-01",
        pseudo: "alex92",
        phone: "0612345678",
        role: "ROLE_USER",
        canSeePrivate: false,
      }),
    });

    const user = await updateMyProfile({
      firstname: "Alex",
      lastname: "Martin",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me"),
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"firstname":"Alex"'),
      }),
    );
    expect(user.email).toBe("alex@example.com");
  });

  it("updates current user email with current password", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: 12,
          lastname: "Martin",
          firstname: "Alex",
          email: "new@example.com",
          dateOfBirth: "1992-01-01",
          role: "ROLE_USER",
          canSeePrivate: false,
        },
        token: "new.jwt.token",
      }),
    });

    const result = await updateMyEmail({
      email: "new@example.com",
      currentPassword: "current-password",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me/email"),
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"currentPassword":"current-password"'),
      }),
    );
    expect(result.user.email).toBe("new@example.com");
    expect(result.token).toBe("new.jwt.token");
  });

  it("updates current user password with current password", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: 12,
          lastname: "Martin",
          firstname: "Alex",
          email: "alex@example.com",
          dateOfBirth: "1992-01-01",
          role: "ROLE_USER",
          canSeePrivate: false,
        },
        token: "rotated.jwt.token",
      }),
    });

    const result = await updateMyPassword({
      currentPassword: "current-password",
      newPassword: "new-password-123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me/password"),
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"currentPassword":"current-password"'),
      }),
    );
    expect(result.user.email).toBe("alex@example.com");
    expect(result.token).toBe("rotated.jwt.token");
  });

  // ── Error paths ──────────────────────────────────────────────────────────

  it("throws when getUsers fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, text: async () => "" });
    await expect(getUsers()).rejects.toThrow(
      "Impossible de charger les utilisateurs",
    );
  });

  it("throws when getUser fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await expect(getUser(99)).rejects.toThrow(
      "Impossible de charger l'utilisateur",
    );
  });

  it("throws when getCurrentUser fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await expect(getCurrentUser()).rejects.toThrow(
      "Impossible de charger l'utilisateur courant",
    );
  });

  it("throws when createUser fails with text body", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Email already taken" }),
    });
    await expect(
      createUser({
        lastname: "X",
        firstname: "Y",
        email: "x@y.com",
        password: "Password1234!",
        dateOfBirth: "1990-01-01",
      }),
    ).rejects.toThrow("Email already taken");
  });

  it("throws when updateUser fails", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Forbidden" }),
    });
    await expect(updateUser(1, { role: "ROLE_ADMIN" })).rejects.toThrow(
      "Forbidden",
    );
  });

  it("throws when deleteUser fails", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await expect(deleteUser(1)).rejects.toThrow(
      "Impossible de supprimer l'utilisateur",
    );
  });

  it("throws when deleteCurrentUser fails with detail message", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Non autorisé." }),
    });
    await expect(deleteCurrentUser()).rejects.toThrow("Non autorisé.");
  });

  it("throws when updateMyProfile fails", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Validation échouée." }),
    });
    await expect(updateMyProfile({ firstname: "X" })).rejects.toThrow(
      "Validation échouée.",
    );
  });

  it("throws when updateMyEmail fails with violations", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        violations: [{ message: "Email invalide." }],
      }),
    });
    await expect(
      updateMyEmail({ email: "bad", currentPassword: "pw" }),
    ).rejects.toThrow("Email invalide.");
  });

  it("throws when updateMyPassword fails with generic error", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    await expect(
      updateMyPassword({ currentPassword: "old", newPassword: "new123" }),
    ).rejects.toThrow("Une erreur est survenue.");
  });

  // ── Normalisation edge cases ──────────────────────────────────────────────

  it("handles getUsers with member array format", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        member: [
          {
            id: 10,
            lastname: "Test",
            firstname: "User",
            email: "t@t.com",
            dateOfBirth: "1990-01-01",
            role: "ROLE_USER",
            canSeePrivate: false,
          },
        ],
      }),
    });

    const result = await getUsers();
    expect(result.users).toHaveLength(1);
  });

  it("handles getUsers with items array format and pagination view", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 11,
            lastname: "P",
            firstname: "Q",
            email: "pq@t.com",
            dateOfBirth: "1991-02-02",
            role: "ROLE_USER",
            canSeePrivate: false,
          },
        ],
        "hydra:view": { next: "/api/users?page=2", last: "/api/users?page=5" },
        "hydra:totalItems": 50,
      }),
    });

    const result = await getUsers(1);
    expect(result.users).toHaveLength(1);
    expect(result.view?.next).toContain("page=2");
    expect(result.totalItems).toBe(50);
  });

  it("handles JSON parse error when fetching users", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    await expect(getUsers()).rejects.toThrow();
  });

  it("handles fetch error when getting users", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(getUsers()).rejects.toThrow("Network error");
  });

  it("handles HTTP error when getting current user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "User not found" }),
    });

    await expect(getCurrentUser()).rejects.toThrow(
      "Impossible de charger l'utilisateur courant",
    );
  });

  it("handles HTTP error when creating user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Email already exists" }),
    });

    await expect(
      createUser({
        firstname: "Test",
        lastname: "User",
        email: "test@example.com",
        password: "Password1234!",
        dateOfBirth: "1990-01-01",
        role: "ROLE_USER",
      }),
    ).rejects.toThrow("Email already exists");
  });

  it("handles HTTP error when updating email", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Email update failed" }),
    });

    await expect(
      updateMyEmail({
        email: "new@example.com",
        currentPassword: "Password1234!",
      }),
    ).rejects.toThrow("Email update failed");
  });

  it("handles HTTP error when updating password", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Invalid password" }),
    });

    await expect(
      updateMyPassword({
        currentPassword: "OldPass1234!",
        newPassword: "NewPass1234!",
      }),
    ).rejects.toThrow("Invalid password");
  });

  it("handles JSON parse error when deleting user", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    await expect(deleteUser(1)).rejects.toThrow();
  });

  it("handles fetch error when updating profile", async () => {
    mockCsrf();
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      updateMyProfile({
        firstname: "Updated",
        lastname: "Name",
        dateOfBirth: "1990-01-01",
      }),
    ).rejects.toThrow("Network error");
  });

  it("handles violations array in error response", async () => {
    mockCsrf();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        violations: [
          {
            message: "Validation failed",
            propertyPath: "email",
          },
        ],
      }),
    });

    await expect(
      updateMyEmail({ email: "invalid", currentPassword: "Pass1234!" }),
    ).rejects.toThrow("Validation failed");
  });

  it("handles getUsers with plain array response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 12,
          lastname: "A",
          firstname: "B",
          email: "ab@t.com",
          dateOfBirth: "1992-03-03",
          role: "ROLE_USER",
          canSeePrivate: false,
        },
      ],
    });

    const result = await getUsers();
    expect(result.users).toHaveLength(1);
  });

  it("normalises canSeePrivate from numeric value", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 30,
        lastname: "Num",
        firstname: "Test",
        email: "num@t.com",
        dateOfBirth: "1990-01-01",
        role: "ROLE_USER",
        canSeePrivate: 1,
      }),
    });

    const user = await getUser(30);
    expect(user.canSeePrivate).toBe(true);
  });

  it("normalises canSeePrivate from string true", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 31,
        lastname: "Str",
        firstname: "Test",
        email: "str@t.com",
        dateOfBirth: "1990-01-01",
        role: "ROLE_USER",
        canSeePrivate: "true",
      }),
    });

    const user = await getUser(31);
    expect(user.canSeePrivate).toBe(true);
  });

  it("maps createdAt and updatedAt from API response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 32,
        lastname: "T",
        firstname: "U",
        email: "tu@t.com",
        dateOfBirth: "1990-01-01",
        role: "ROLE_USER",
        canSeePrivate: false,
        createdAt: "2026-01-01T00:00:00+00:00",
        updatedAt: "2026-06-01T00:00:00+00:00",
      }),
    });

    const user = await getUser(32);
    expect(user.createdAt).toBe("2026-01-01T00:00:00+00:00");
    expect(user.updatedAt).toBe("2026-06-01T00:00:00+00:00");
  });
});
