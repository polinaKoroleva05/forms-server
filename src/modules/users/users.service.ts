import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { UserCreateDto } from './dto/userCreate.dto';
import { UserGetDto } from './dto/userGet.dto';
import { IUserCreateResponse, IUsersData } from './users.interface';
import { v4 as uuid } from 'uuid';
import { findUserByEmail } from './utils';
import { UserPatchDto } from './dto/userPatch.dto';
import * as path from 'path';
import * as fs from 'fs';
import { put } from '@vercel/blob';

export class UsersService {
    private pathToDB: string =
        'https://fknl1z2zeiaknvob.public.blob.vercel-storage.com/db.json';
    // private usersDB: Record<string, IUsersData>;
    // constructor(){
    //     this.usersDB = {
    //         '1': {
    //             name: 'Admin',
    //             id: '1',
    //             surName: 'Admin',
    //             fullName: 'Admin',
    //             password: 'admin',
    //             email: 'admin@inno.tech',
    //         },
    //     };
    // }
    async saveBase(base: Record<string, IUsersData>): Promise<string> {
        try {
            console.log('base', base);
            const baseString = JSON.stringify(base);
            console.log('baseString', baseString);
            console.log('start put blob');
            const blob = await put('db.json', baseString, {
                access: 'public',
                allowOverwrite: true,
                token: process.env.BLOB_READ_WRITE_TOKEN,
                contentType: 'application/json',
                cacheControlMaxAge: 60
            });
            console.log('end put blob', blob);
            return blob.url;
        } catch (err) {
            throw new Error('Error while saving base' + err);
        }

        // try {
        //     fs.writeFileSync(this.pathToDB, JSON.stringify(base));
        // } catch (err) {
        //     if (err.code === 'EROFS') {
        //         console.log('vercel error write file');
        //     }
        // }
    }

    async readBase(): Promise<Record<string, IUsersData>> {
        let response;
        try {
            response = await fetch(this.pathToDB);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
                const data = await response.json();
                console.log('Retrieved JSON data:', data);
                return data;
        } catch (error) {
            console.log('Cant read base' + JSON.stringify(error) + response);
            return {
                '0': {
                    name: 'Afff',
                    id: '0',
                    surName: 'AAfff',
                    fullName: 'Af AAf',
                    password: 'admini',
                    email: 'admini@inno.tech',
                },
            };
        }

        // const usersDBraw = fs.readFileSync(this.pathToDB, 'utf-8');
        // let usersDB = JSON.parse(usersDBraw);
        // return usersDB;
    }

    async getAll(): Promise<UserGetDto[]> {
        const usersDB = await this.readBase();
        return Object.values(usersDB).map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ password, ...rest }: IUsersData) => ({ ...rest }),
        );
    }

    async createUser({
        email,
        name,
        ...rest
    }: UserCreateDto): Promise<IUserCreateResponse> {
        const usersDB = await this.readBase();
        const id = uuid();

        const checkIsEmailUnique = findUserByEmail(usersDB, email);

        if (checkIsEmailUnique)
            throw new HttpException('Already exist', HttpStatus.CONFLICT);

        usersDB[id] = { ...rest, email, name, id };
        console.log('before save');
        let url = await this.saveBase(usersDB);
        this.pathToDB = url;

        return { name, id };
    }

    async findById(id: string): Promise<UserGetDto | NotFoundException> {
        const usersDB = await this.readBase();
        const user = usersDB[id];

        if (!user) throw new NotFoundException();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...response } = user;
        return response;
    }

    async updateUser(
        id: string,
        data: UserPatchDto,
    ): Promise<string | NotFoundException> {
        const usersDB = await this.readBase();
        const user = usersDB[id];

        if (!user) {
            if (!user) throw new NotFoundException();
        }

        const { password, email, id: userId } = user;
        usersDB[id] = { password, id: userId, email, ...data };
        let url = await this.saveBase(usersDB);
        this.pathToDB = url;

        return 'ok';
    }

    async findOneByEmail(email: string): Promise<IUsersData | null> {
        const usersDB = await this.readBase();
        const user = findUserByEmail(usersDB, email);

        return user || null;
    }

    async deleteUser(id: string): Promise<void> {
        const usersDB = await this.readBase();
        delete usersDB[id];
        let url = await this.saveBase(usersDB);
        this.pathToDB = url;
    }
}
