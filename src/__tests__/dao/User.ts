export interface User {
    id: number;
    uuid: string;
    username: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active: boolean;
    role: 'admin' | 'user' | 'guest';
    last_login?: Date;
    created_at: Date;
    updated_at: Date;
}