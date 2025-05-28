import { Module, OnModuleInit } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { initializeCloudinary } from './cloudinary.config';
import { ConfigService } from '@nestjs/config';

@Module({
    providers: [CloudinaryService],
    exports: [CloudinaryService],
})
export class CloudinaryModule implements OnModuleInit {
    constructor(private configService: ConfigService) { }

    onModuleInit() {
        // Initialize Cloudinary when the module is initialized
        initializeCloudinary();
    }
} 