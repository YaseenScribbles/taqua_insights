export interface User {
    id: number;
    name: string;
    email: string;
    role:string;
    email_verified_at?: string;
}

export type AppSharedProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
