import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WarehouseProduct } from './warehouse.interface.js';

interface WarehouseApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'WAREHOUSE_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  async getProductsByIds(
    ids: string[],
    authToken: string,
  ): Promise<WarehouseProduct[]> {
    if (!ids.length) {
      return [];
    }

    try {
      const { data: response } = await firstValueFrom(
        this.httpService.get<
          WarehouseApiResponse<PaginatedResponse<WarehouseProduct>>
        >(`${this.baseUrl}/products`, {
          params: { ids: ids.join(','), limit: ids.length },
          headers: { Authorization: authToken },
        }),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch products by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getProductById(
    id: string,
    authToken: string,
  ): Promise<WarehouseProduct> {
    try {
      const { data: response } = await firstValueFrom(
        this.httpService.get<WarehouseApiResponse<WarehouseProduct>>(
          `${this.baseUrl}/products/${id}`,
          {
            headers: { Authorization: authToken },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch product ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
