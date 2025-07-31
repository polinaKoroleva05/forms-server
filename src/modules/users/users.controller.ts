import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Response,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IUserCreateResponse } from './users.interface';
import { UserCreateDto } from './dto/userCreate.dto';
import { UserGetDto } from './dto/userGet.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserPatchDto } from './dto/userPatch.dto';

@ApiBasicAuth()
@ApiTags('users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get list of users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', isArray: true })
  @Get()
  async getAll(): Promise<UserGetDto[]> {
    const response = await this.usersService.getAll()
    return response;
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async getUser(@Param('id') id: string):Promise< UserGetDto | NotFoundException> {
    const response = await this.usersService.findById(id)
    return response;
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() data: UserPatchDto) {
    const response = await this.usersService.updateUser(id, data)
    return response;
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({
    description: 'Success',
  })
  async createUser(@Body() data: UserCreateDto): Promise<IUserCreateResponse> {
    try{
        let response = await this.usersService.createUser(data);
        return response
    }catch(err){
        console.log('createUser controller', err)
        return { name: '', id: '' }
    }
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete user' })
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<string> {
    try{
        await this.usersService.deleteUser(id);
        return 'Ok';
    }catch(err){
        return 'err' + JSON.stringify(err)
    }
  }
}
