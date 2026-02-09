import { Body, Controller, Delete, Get, Patch, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { UpdateUserDto } from 'src/user-management/dto/update-user.dto';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@Req() req: Request) {
    const user = req['user'] as User;
    return this.userService.me(user._id.toString());
  }

  @Patch('me')
  updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req['user'] as User;
    return this.userService.updateMe(user._id.toString(), updateUserDto);
  }

  @Delete('me')
  deleteMe(@Req() req: Request) {
    const user = req['user'] as User;
    return this.userService.deleteMe(user._id.toString());
  }
}
