import { Controller, Get, Param } from "@nestjs/common";
import { CountriesService } from "./countries.service";

@Controller("countries")
export class CountriesController {
  constructor(private readonly countries: CountriesService) {}

  @Get()
  list() {
    return this.countries.list();
  }

  @Get(":countryCode")
  get(@Param("countryCode") countryCode: string) {
    return this.countries.get(countryCode);
  }
}
