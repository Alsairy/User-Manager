using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UserManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandContractsInvestors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Investors_Email",
                table: "Investors");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ReferenceNumber",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Paid",
                table: "Installments");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Investors",
                newName: "NameEn");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "Installments",
                newName: "AmountDue");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Contracts",
                newName: "InvestorNameEn");

            migrationBuilder.RenameColumn(
                name: "ReferenceNumber",
                table: "Contracts",
                newName: "LandCode");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "Contracts",
                newName: "TotalContractAmount");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Investors",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Investors",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Investors",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Investors",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyRegistration",
                table: "Investors",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson",
                table: "Investors",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Investors",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InvestorCode",
                table: "Investors",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Investors",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Investors",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Investors",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxId",
                table: "Investors",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "DueDate",
                table: "Installments",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Installments",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InstallmentNumber",
                table: "Installments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Installments",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PartialAmountPaid",
                table: "Installments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PaymentDate",
                table: "Installments",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptFileName",
                table: "Installments",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptFileUrl",
                table: "Installments",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceiptUploadedAt",
                table: "Installments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptUploadedBy",
                table: "Installments",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingBalance",
                table: "Installments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Installments",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Installments",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Contracts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<decimal>(
                name: "AnnualRentalAmount",
                table: "Contracts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ApprovalAuthority",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ArchivedBy",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssetId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "AssetNameAr",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssetNameEn",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CancellationDocuments",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CancellationJustification",
                table: "Contracts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Contracts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractCode",
                table: "Contracts",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ContractDuration",
                table: "Contracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Contracts",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "EndDate",
                table: "Contracts",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<int>(
                name: "InstallmentCount",
                table: "Contracts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstallmentFrequency",
                table: "Contracts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstallmentPlanType",
                table: "Contracts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvestorId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "InvestorNameAr",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegalTermsReference",
                table: "Contracts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Contracts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SignedPdfUploadedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignedPdfUrl",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "SigningDate",
                table: "Contracts",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<string>(
                name: "SpecialConditions",
                table: "Contracts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "StartDate",
                table: "Contracts",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAnnualAmount",
                table: "Contracts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VatRate",
                table: "Contracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Investors_InvestorCode",
                table: "Investors",
                column: "InvestorCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ContractCode",
                table: "Contracts",
                column: "ContractCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Investors_InvestorCode",
                table: "Investors");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ContractCode",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "CompanyRegistration",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "ContactPerson",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "InvestorCode",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "TaxId",
                table: "Investors");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "InstallmentNumber",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "PartialAmountPaid",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "ReceiptFileName",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "ReceiptFileUrl",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "ReceiptUploadedAt",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "ReceiptUploadedBy",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "RemainingBalance",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "AnnualRentalAmount",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ApprovalAuthority",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ArchivedBy",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "AssetNameAr",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "AssetNameEn",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CancellationDocuments",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CancellationJustification",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ContractCode",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ContractDuration",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "InstallmentCount",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "InstallmentFrequency",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "InstallmentPlanType",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "InvestorId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "InvestorNameAr",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "LegalTermsReference",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SignedPdfUploadedAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SignedPdfUrl",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SigningDate",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SpecialConditions",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "TotalAnnualAmount",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "VatRate",
                table: "Contracts");

            migrationBuilder.RenameColumn(
                name: "NameEn",
                table: "Investors",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "AmountDue",
                table: "Installments",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "TotalContractAmount",
                table: "Contracts",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "LandCode",
                table: "Contracts",
                newName: "ReferenceNumber");

            migrationBuilder.RenameColumn(
                name: "InvestorNameEn",
                table: "Contracts",
                newName: "Title");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Investors",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Investors",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "DueDate",
                table: "Installments",
                type: "datetimeoffset",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AddColumn<bool>(
                name: "Paid",
                table: "Installments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Contracts",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.CreateIndex(
                name: "IX_Investors_Email",
                table: "Investors",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ReferenceNumber",
                table: "Contracts",
                column: "ReferenceNumber",
                unique: true);
        }
    }
}
