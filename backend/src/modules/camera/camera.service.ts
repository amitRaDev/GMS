import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camera } from '../../common/entities/camera.entity';
import { CreateCameraDto, UpdateCameraDto } from './dto/camera.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);

  constructor(
    @InjectRepository(Camera)
    private cameraRepo: Repository<Camera>,
  ) {}

  async findAll(): Promise<Camera[]> {
    return this.cameraRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Camera> {
    const camera = await this.cameraRepo.findOne({ where: { id } });
    if (!camera) throw new NotFoundException('Camera not found');
    return camera;
  }

  async findByCameraId(cameraId: string): Promise<Camera | null> {
    return this.cameraRepo.findOne({ where: { cameraId } });
  }

  async create(dto: CreateCameraDto): Promise<Camera> {
    const apiToken = this.generateToken();
    const camera = this.cameraRepo.create({ ...dto, apiToken });
    return this.cameraRepo.save(camera);
  }

  async update(id: string, dto: UpdateCameraDto): Promise<Camera> {
    const camera = await this.findOne(id);
    Object.assign(camera, dto);
    return this.cameraRepo.save(camera);
  }

  async delete(id: string): Promise<void> {
    const camera = await this.findOne(id);
    await this.cameraRepo.remove(camera);
  }

  async regenerateToken(id: string): Promise<Camera> {
    const camera = await this.findOne(id);
    camera.apiToken = this.generateToken();
    return this.cameraRepo.save(camera);
  }

  async validateToken(cameraId: string, token: string): Promise<boolean> {
    const camera = await this.findByCameraId(cameraId);
    if (!camera || !camera.isActive) return false;
    return camera.apiToken === token;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
