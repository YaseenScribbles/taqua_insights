export type CreateUser = {
    name: string;
    email: string;
    password?: string | null;
    password_confirmation?: string | null;
    role: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
}



export async function getUsers() : Promise<User[]> {
    const {
        data: { users : data },
    } = await window.axios.get(route("users.index"));
    return data;
}

export async function addUserApi(user: CreateUser) {
    const {
        data: { message },
    } = await window.axios.post(route("users.store"), { ...user });
    return message;
}

export async function updateUserApi(user: CreateUser, id: number) {
    const {
        data: { message },
    } = await window.axios.put(route("users.update", id), { ...user });
    return message;
}

export async function deleteUserApi(id: number) {
    const {
        data: { message },
    } = await window.axios.delete(route("users.destroy", id));
    return message;
}
