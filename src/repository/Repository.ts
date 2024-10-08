import { PrismaClient } from "@prisma/client";
import CustomError, {
    DatabaseConnectionError,
    Duplicated,
    InvalidValue,
    NotFound,
    UnknownRequest, ValidationError
} from "../errors/CustomError";
import {PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";


export default class Repository {

    constructor(    ) {
    }
    private static prismaClient : PrismaClient
     static getPrismaClient() : PrismaClient {
        if(!this.prismaClient ) {
            this.prismaClient = new PrismaClient
        }
        return this.prismaClient
    }

     handlePrismaErrors(error: Error | any): Error {
        let name : string = this.constructor.name.split("R")[0]
        if (typeof error === 'object' && error !== null && 'name' in error) {
            const errorType = (error as Error).name;

            if (errorType.toLowerCase().includes('prisma')) {
                switch (errorType) {
                    case 'PrismaClientInitializationError':
                        return new DatabaseConnectionError()

                    case 'PrismaClientKnownRequestError':
                        return handleCodesPrisma(error, name);

                    case 'PrismaClientUnknownRequestError':
                        return new UnknownRequest(error.message)
                    case 'PrismaClientValidationError':
                        return new ValidationError(name, error.message)

                    default:
                        return new Error('An unknown Prisma error occurred');
                }
            }
        }

        return error
    }
}




function handleCodesPrisma(error: any, entityName : string): Error {
    switch (error.code) {
        case 'P2002':
            return new Duplicated(error.message.split(':')[2].split("_")[1].toUpperCase())
        case 'P2014':
            // handling invalid id errors
            return new InvalidValue('Invalid ID', `${error.meta.target}`);
        case 'P2003':
            // handling invalid data errors
            return new ValidationError(`input data`, `${error.meta.target}`)
        case 'P2025':
          return new NotFound(entityName)
        default:
            return error
    }
}


