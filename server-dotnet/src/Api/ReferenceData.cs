using System.Linq;

namespace UserManager.Api;

public static class ReferenceData
{
    public static readonly RegionDto[] Regions =
    {
        new RegionDto("riyadh", "الرياض", "Riyadh", "RYD"),
        new RegionDto("makkah", "مكة", "Makkah", "MKK"),
        new RegionDto("eastern", "الشرقية", "Eastern", "EST")
    };

    public static readonly CityDto[] Cities =
    {
        new CityDto("riyadh-city", "riyadh", "الرياض", "Riyadh", "RYD-01"),
        new CityDto("jeddah-city", "makkah", "جدة", "Jeddah", "JDH-01"),
        new CityDto("dammam-city", "eastern", "الدمام", "Dammam", "DMM-01")
    };

    public static readonly DistrictDto[] Districts =
    {
        new DistrictDto("riyadh-d1", "riyadh-city", "حي العليا", "Al Olaya", "RYD-D1"),
        new DistrictDto("jeddah-d1", "jeddah-city", "الروضة", "Al Rawdah", "JDH-D1"),
        new DistrictDto("dammam-d1", "dammam-city", "الفيصلية", "Al Faisaliyah", "DMM-D1")
    };

    public static RegionDto? FindRegion(string? id) =>
        Regions.FirstOrDefault(r => string.Equals(r.Id, id, StringComparison.OrdinalIgnoreCase));

    public static CityDto? FindCity(string? id) =>
        Cities.FirstOrDefault(c => string.Equals(c.Id, id, StringComparison.OrdinalIgnoreCase));

    public static DistrictDto? FindDistrict(string? id) =>
        Districts.FirstOrDefault(d => string.Equals(d.Id, id, StringComparison.OrdinalIgnoreCase));

    public sealed record RegionDto(string Id, string NameAr, string NameEn, string Code);

    public sealed record CityDto(string Id, string RegionId, string NameAr, string NameEn, string Code);

    public sealed record DistrictDto(string Id, string CityId, string NameAr, string NameEn, string Code);
}
