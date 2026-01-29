using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandAssetLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "IsnadForms",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Attachments",
                table: "IsnadForms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "IsnadForms",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "IsnadForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "IsnadForms",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "IsnadForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "IsnadForms",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrentAssigneeId",
                table: "IsnadForms",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentStage",
                table: "IsnadForms",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CurrentStepIndex",
                table: "IsnadForms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "PackageId",
                table: "IsnadForms",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReturnCount",
                table: "IsnadForms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReason",
                table: "IsnadForms",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnedByStage",
                table: "IsnadForms",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaDeadline",
                table: "IsnadForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SlaStatus",
                table: "IsnadForms",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "IsnadForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RegionId",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NameAr",
                table: "Assets",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DistrictId",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Assets",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CityId",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdministrativeNotes",
                table: "Assets",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Attachments",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "BuiltUpArea",
                table: "Assets",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Assets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Assets",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrentStage",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentStatus",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustodyDetails",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomFeatures",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeedDate",
                table: "Assets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeedNumber",
                table: "Assets",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Features",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "FinancialDues",
                table: "Assets",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasActiveContract",
                table: "Assets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasActiveIsnad",
                table: "Assets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "InvestmentPotential",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LandUseType",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Assets",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LocationValidated",
                table: "Assets",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Assets",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NearbyAssetsJustification",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Assets",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnershipDocuments",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnershipType",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationMode",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionJustification",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Assets",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedReferences",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Restrictions",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpecialConditions",
                table: "Assets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StreetAddress",
                table: "Assets",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Assets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalExposureDays",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Assets",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerifiedBy",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "VisibilityCount",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ZoningClassification",
                table: "Assets",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssetVisibilityHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisibilityStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DurationDays = table.Column<int>(type: "int", nullable: true),
                    ChangedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetVisibilityHistory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssetWorkflowHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Stage = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ReviewerId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ReviewerDepartment = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Comments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    RejectionJustification = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DocumentsAdded = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetWorkflowHistory", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetVisibilityHistory");

            migrationBuilder.DropTable(
                name: "AssetWorkflowHistory");

            migrationBuilder.DropColumn(
                name: "Attachments",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CurrentAssigneeId",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CurrentStage",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "CurrentStepIndex",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "PackageId",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "ReturnCount",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "ReturnedByStage",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "SlaDeadline",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "SlaStatus",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "IsnadForms");

            migrationBuilder.DropColumn(
                name: "AdministrativeNotes",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Attachments",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "BuiltUpArea",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CurrentStage",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CurrentStatus",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CustodyDetails",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CustomFeatures",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "DeedDate",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "DeedNumber",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Features",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "FinancialDues",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "HasActiveContract",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "HasActiveIsnad",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "InvestmentPotential",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LandUseType",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LocationValidated",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "NearbyAssetsJustification",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "OwnershipDocuments",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "OwnershipType",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "RegistrationMode",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "RejectionJustification",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "RelatedReferences",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Restrictions",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "SpecialConditions",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "StreetAddress",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "TotalExposureDays",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "VerifiedBy",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "VisibilityCount",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "ZoningClassification",
                table: "Assets");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "IsnadForms",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RegionId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "NameAr",
                table: "Assets",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256);

            migrationBuilder.AlterColumn<string>(
                name: "DistrictId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CityId",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);
        }
    }
}
