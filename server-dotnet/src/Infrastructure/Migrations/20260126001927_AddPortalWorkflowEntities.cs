using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPortalWorkflowEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssetId",
                table: "IsnadForms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssetType",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CityId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DistrictId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Assets",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegionId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TotalArea",
                table: "Assets",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "VisibleToInvestors",
                table: "Assets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "InvestorFavorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvestorAccountId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestorFavorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvestorFavorites_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InvestorInterests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    InvestorAccountId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvestmentPurpose = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProposedUseDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    InvestmentAmountRange = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ExpectedTimeline = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AdditionalComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Attachments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AssignedToId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConvertedContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestorInterests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvestorInterests_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IsnadPackages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PackageCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PackageName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    InvestmentStrategy = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Priority = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DurationYears = table.Column<int>(type: "int", nullable: true),
                    DurationMonths = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ExpectedRevenue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalValuation = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAssets = table.Column<int>(type: "int", nullable: false),
                    CeoApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CeoComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MinisterApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MinisterComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PackageDocumentUrl = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IsnadPackages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IstifadaRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    InvestorAccountId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProgramType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProgramTitle = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ProgramDescription = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    TargetBeneficiaries = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BudgetEstimate = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ProposalDocuments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FinancialPlanDocuments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrganizationCredentials = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AdditionalDocuments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    AssignedToId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdditionalInfoRequest = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IstifadaRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IstifadaRequests_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "IsnadPackageForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PackageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IsnadPackageForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IsnadPackageForms_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_IsnadPackageForms_IsnadForms_FormId",
                        column: x => x.FormId,
                        principalTable: "IsnadForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IsnadPackageForms_IsnadPackages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "IsnadPackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IsnadForms_AssetId",
                table: "IsnadForms",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestorFavorites_AssetId",
                table: "InvestorFavorites",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestorFavorites_InvestorAccountId_AssetId",
                table: "InvestorFavorites",
                columns: new[] { "InvestorAccountId", "AssetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvestorInterests_AssetId",
                table: "InvestorInterests",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestorInterests_ReferenceNumber",
                table: "InvestorInterests",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IsnadPackageForms_AssetId",
                table: "IsnadPackageForms",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_IsnadPackageForms_FormId",
                table: "IsnadPackageForms",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_IsnadPackageForms_PackageId_FormId",
                table: "IsnadPackageForms",
                columns: new[] { "PackageId", "FormId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IsnadPackages_PackageCode",
                table: "IsnadPackages",
                column: "PackageCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IstifadaRequests_AssetId",
                table: "IstifadaRequests",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_IstifadaRequests_ReferenceNumber",
                table: "IstifadaRequests",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_IsnadForms_Assets_AssetId",
                table: "IsnadForms",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IsnadForms_Assets_AssetId",
                table: "IsnadForms");

            migrationBuilder.DropTable(
                name: "InvestorFavorites");

            migrationBuilder.DropTable(
                name: "InvestorInterests");

            migrationBuilder.DropTable(
                name: "IsnadPackageForms");

            migrationBuilder.DropTable(
                name: "IstifadaRequests");

            migrationBuilder.DropTable(
                name: "IsnadPackages");

            migrationBuilder.DropIndex(
                name: "IX_IsnadForms_AssetId",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "AssetType",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CityId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "DistrictId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "RegionId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "TotalArea",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "VisibleToInvestors",
                table: "Assets");
        }
    }
}
