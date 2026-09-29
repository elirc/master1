import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/services/prisma.service";

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.countryProfile.findMany({
      orderBy: { countryCode: "asc" }
    });
  }

  async get(countryCode: string) {
    const country = await this.prisma.countryProfile.findUnique({
      where: { countryCode: countryCode.toUpperCase() }
    });

    if (!country) {
      throw new NotFoundException(`Country ${countryCode} is not configured.`);
    }

    return country;
  }
}
