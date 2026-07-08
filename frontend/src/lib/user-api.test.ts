import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
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

  it("gets a single user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        lastname: "Durand",
        firstname: "Lucas",
        email: "lucas@example.com",
        dateOfBirth: "1990-02-14",
        age: 34,
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

  it("creates a user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 3,
        lastname: "Roux",
        firstname: "Nina",
        email: "nina@example.com",
        dateOfBirth: "1995-04-20",
        age: 29,
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
      age: 29,
      role: "ROLE_USER",
      canSeePrivate: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(user.id).toBe(3);
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
        age: 26,
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

  it("deletes a user", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    await deleteUser(8);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/8"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
