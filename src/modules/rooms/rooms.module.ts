import { Module } from '@nestjs/common';
import { RoomCategoriesController } from './room-categories.controller.js';
import { RoomCategoriesService } from './room-categories.service.js';
// import { RoomClassesController } from './room-classes.controller.js';
// import { RoomClassesService } from './room-classes.service.js';
import { RoomsController } from './rooms.controller.js';
import { RoomsService } from './rooms.service.js';
// import { BedsController } from './beds.controller.js';
// import { BedsService } from './beds.service.js';

@Module({
  controllers: [
    RoomCategoriesController,
    RoomsController,
    // RoomClassesController,
    // BedsController,
  ],
  providers: [
    RoomCategoriesService,
    RoomsService,
    // RoomClassesService,
    // BedsService,
  ],
  exports: [RoomsService],
})
export class RoomsModule {}
