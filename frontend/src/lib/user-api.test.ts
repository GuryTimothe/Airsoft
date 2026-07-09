import {
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

    const users = await getUsers();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
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
  });

  it("creates a user", async () => {
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
      password: "secret123",
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
      password: "secret123",
      dateOfBirth: "1996-03-08",
      role: "ROLE_ORGANIZER",
      canSeePrivate: true,
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(options.body));

    expect(body.canSeePrivate).toBe(true);
    expect(body.can_see_private).toBeUndefined();
  });

  it("updates a user", async () => {
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

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(options.body));

    expect(body.canSeePrivate).toBe(true);
    expect(body.can_see_private).toBeUndefined();
  });

  it("deletes a user", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await deleteUser(8);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/8"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("updates current user general profile without password", async () => {
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
});
