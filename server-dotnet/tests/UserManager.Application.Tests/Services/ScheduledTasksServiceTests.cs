using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class ScheduledTasksServiceTests
{
    private readonly Mock<IServiceProvider> _serviceProviderMock;
    private readonly Mock<IServiceScope> _serviceScopeMock;
    private readonly Mock<IServiceScopeFactory> _serviceScopeFactoryMock;
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<ScheduledTasksService>> _loggerMock;

    public ScheduledTasksServiceTests()
    {
        _serviceProviderMock = new Mock<IServiceProvider>();
        _serviceScopeMock = new Mock<IServiceScope>();
        _serviceScopeFactoryMock = new Mock<IServiceScopeFactory>();
        _dbContextMock = new Mock<IAppDbContext>();
        _notificationServiceMock = new Mock<INotificationService>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<ScheduledTasksService>>();

        // Setup service provider chain
        var scopedServiceProvider = new Mock<IServiceProvider>();
        scopedServiceProvider.Setup(x => x.GetService(typeof(IAppDbContext))).Returns(_dbContextMock.Object);
        scopedServiceProvider.Setup(x => x.GetService(typeof(INotificationService))).Returns(_notificationServiceMock.Object);
        scopedServiceProvider.Setup(x => x.GetService(typeof(IEmailService))).Returns(_emailServiceMock.Object);

        _serviceScopeMock.Setup(x => x.ServiceProvider).Returns(scopedServiceProvider.Object);
        _serviceScopeFactoryMock.Setup(x => x.CreateScope()).Returns(_serviceScopeMock.Object);
        _serviceProviderMock.Setup(x => x.GetService(typeof(IServiceScopeFactory))).Returns(_serviceScopeFactoryMock.Object);
    }

    #region Helper Methods

    private static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<T>>();

        mockDbSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new ScheduledTasksTestAsyncEnumerator<T>(queryable.GetEnumerator()));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new ScheduledTasksTestAsyncQueryProvider<T>(queryable.Provider));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.GetEnumerator())
            .Returns(() => queryable.GetEnumerator());

        return mockDbSet;
    }

    private static Contract CreateTestContract(
        ContractStatus status = ContractStatus.Active,
        DateOnly? endDate = null,
        string contractCode = "CNT-TEST-001")
    {
        return new Contract
        {
            Id = Guid.NewGuid(),
            ContractCode = contractCode,
            Status = status,
            EndDate = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(60)),
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid(),
            LandCode = "LAND-001",
            AssetNameAr = "اسم الأصل",
            AssetNameEn = "Asset Name",
            InvestorNameAr = "اسم المستثمر",
            InvestorNameEn = "Investor Name",
            AnnualRentalAmount = 100000,
            TotalContractAmount = 300000,
            ContractDuration = 3,
            SigningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30))
        };
    }

    private static Installment CreateTestInstallment(
        Guid contractId,
        InstallmentStatus status = InstallmentStatus.Pending,
        DateOnly? dueDate = null,
        int installmentNumber = 1)
    {
        return new Installment
        {
            Id = Guid.NewGuid(),
            ContractId = contractId,
            InstallmentNumber = installmentNumber,
            AmountDue = 10000,
            Status = status,
            DueDate = dueDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))
        };
    }

    private static IsnadForm CreateTestIsnadForm(
        IsnadStatus status = IsnadStatus.PendingVerification,
        DateTime? slaDeadline = null,
        string? slaStatus = null)
    {
        return new IsnadForm
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = "ISNAD-TEST-001",
            Title = "Test ISNAD Form",
            Status = status,
            CurrentStage = "school_planning",
            SlaDeadline = slaDeadline,
            SlaStatus = slaStatus
        };
    }

    private static Investor CreateTestInvestor(string? email = "investor@example.com")
    {
        return new Investor
        {
            Id = Guid.NewGuid(),
            InvestorCode = "INV-001",
            NameAr = "مستثمر",
            NameEn = "Investor",
            Email = email
        };
    }

    #endregion

    #region CheckExpiringContractsAsync Tests

    [Fact]
    public async Task CheckExpiringContractsAsync_ContractExpiringIn30Days_ShouldMarkAsExpiring()
    {
        // Arrange
        var contract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            contractCode: "CNT-EXPIRING-001");

        var contracts = new List<Contract> { contract };
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        // Create a helper to invoke the private method through the service
        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Expiring);
        contract.UpdatedAt.Should().NotBe(default);

        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Admin",
                "warning",
                "Contract Expiring Soon",
                It.Is<string>(m => m.Contains("CNT-EXPIRING-001")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckExpiringContractsAsync_ContractEndDatePassed_ShouldMarkAsExpired()
    {
        // Arrange
        var contract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            contractCode: "CNT-EXPIRED-001");

        var contracts = new List<Contract> { contract };
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Expired);

        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Admin",
                "info",
                "Contract Expired",
                It.Is<string>(m => m.Contains("CNT-EXPIRED-001")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckExpiringContractsAsync_ExpiringContractEndDatePassed_ShouldMarkAsExpired()
    {
        // Arrange
        var contract = CreateTestContract(
            status: ContractStatus.Expiring,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            contractCode: "CNT-WAS-EXPIRING-001");

        var contracts = new List<Contract> { contract };
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Expired);
    }

    [Fact]
    public async Task CheckExpiringContractsAsync_ContractNotExpiring_ShouldNotModify()
    {
        // Arrange
        var contract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(60)),
            contractCode: "CNT-FUTURE-001");

        var contracts = new List<Contract> { contract };
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Active);

        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckExpiringContractsAsync_NoContracts_ShouldNotSaveChanges()
    {
        // Arrange
        var contracts = new List<Contract>();
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckExpiringContractsAsync_MultipleContracts_ShouldProcessAll()
    {
        // Arrange
        var expiringContract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)),
            contractCode: "CNT-EXPIRING-002");

        var expiredContract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            contractCode: "CNT-EXPIRED-002");

        var futureContract = CreateTestContract(
            status: ContractStatus.Active,
            endDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(90)),
            contractCode: "CNT-FUTURE-002");

        var contracts = new List<Contract> { expiringContract, expiredContract, futureContract };
        var contractsDbSet = CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(contractsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckExpiringContractsAsync(CancellationToken.None);

        // Assert
        expiringContract.Status.Should().Be(ContractStatus.Expiring);
        expiredContract.Status.Should().Be(ContractStatus.Expired);
        futureContract.Status.Should().Be(ContractStatus.Active);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    #endregion

    #region CheckOverdueInstallmentsAsync Tests

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_PendingInstallmentPastDue_ShouldMarkAsOverdue()
    {
        // Arrange
        var contract = CreateTestContract(contractCode: "CNT-INST-001");
        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            installmentNumber: 3);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var investors = new List<Investor>();

        var installmentsDbSet = CreateMockDbSet(installments);
        var investorsDbSet = CreateMockDbSet(investors);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(investorsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        installment.Status.Should().Be(InstallmentStatus.Overdue);
        installment.UpdatedAt.Should().NotBe(default);

        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Admin",
                "warning",
                "Installment Payment Overdue",
                It.Is<string>(m => m.Contains("CNT-INST-001")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_WithInvestorEmail_ShouldSendEmail()
    {
        // Arrange
        var investor = CreateTestInvestor("investor@test.com");
        var contract = CreateTestContract(contractCode: "CNT-EMAIL-001");
        contract.InvestorId = investor.Id;

        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-3)),
            installmentNumber: 2);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var investors = new List<Investor> { investor };

        var installmentsDbSet = CreateMockDbSet(installments);
        var investorsDbSet = CreateMockDbSet(investors);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(investorsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        _emailServiceMock.Verify(
            x => x.SendAsync(
                "investor@test.com",
                "Installment Payment Overdue",
                It.Is<string>(body => body.Contains("Payment Reminder")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_WithoutInvestorEmail_ShouldNotSendEmail()
    {
        // Arrange
        var investor = CreateTestInvestor(email: null);
        var contract = CreateTestContract(contractCode: "CNT-NOEMAIL-001");
        contract.InvestorId = investor.Id;

        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
            installmentNumber: 1);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var investors = new List<Investor> { investor };

        var installmentsDbSet = CreateMockDbSet(installments);
        var investorsDbSet = CreateMockDbSet(investors);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(investorsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        _emailServiceMock.Verify(
            x => x.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_EmailFails_ShouldNotThrow()
    {
        // Arrange
        var investor = CreateTestInvestor("investor@fail.com");
        var contract = CreateTestContract(contractCode: "CNT-FAIL-001");
        contract.InvestorId = investor.Id;

        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            installmentNumber: 1);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var investors = new List<Investor> { investor };

        var installmentsDbSet = CreateMockDbSet(installments);
        var investorsDbSet = CreateMockDbSet(investors);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(investorsDbSet.Object);

        _emailServiceMock
            .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Email service unavailable"));

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        var act = async () => await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        installment.Status.Should().Be(InstallmentStatus.Overdue);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_InstallmentNotOverdue_ShouldNotModify()
    {
        // Arrange
        var contract = CreateTestContract(contractCode: "CNT-FUTURE-INST-001");
        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            installmentNumber: 1);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var installmentsDbSet = CreateMockDbSet(installments);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        installment.Status.Should().Be(InstallmentStatus.Pending);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_AlreadyPaidInstallment_ShouldNotModify()
    {
        // Arrange
        var contract = CreateTestContract(contractCode: "CNT-PAID-001");
        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Paid,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            installmentNumber: 1);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var installmentsDbSet = CreateMockDbSet(installments);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        installment.Status.Should().Be(InstallmentStatus.Paid);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckOverdueInstallmentsAsync_ShouldAddDomainEvent()
    {
        // Arrange
        var contract = CreateTestContract(contractCode: "CNT-EVENT-001");
        var installment = CreateTestInstallment(
            contract.Id,
            status: InstallmentStatus.Pending,
            dueDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            installmentNumber: 1);
        installment.Contract = contract;

        var installments = new List<Installment> { installment };
        var investors = new List<Investor>();

        var installmentsDbSet = CreateMockDbSet(installments);
        var investorsDbSet = CreateMockDbSet(investors);

        _dbContextMock.Setup(x => x.Installments).Returns(installmentsDbSet.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(investorsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckOverdueInstallmentsAsync(CancellationToken.None);

        // Assert
        installment.DomainEvents.Should().NotBeEmpty();
        installment.DomainEvents.Should().ContainSingle(e => e.GetType().Name == "InstallmentOverdueEvent");
    }

    #endregion

    #region CheckIsnadSlaDeadlinesAsync Tests

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_SlaDeadlinePassed_ShouldMarkAsBreached()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingVerification,
            slaDeadline: DateTime.UtcNow.AddHours(-1),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        form.SlaStatus.Should().Be("breached");
        form.UpdatedAt.Should().NotBe(default);

        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Admin",
                "error",
                "ISNAD SLA Breached",
                It.Is<string>(m => m.Contains("ISNAD-TEST-001")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_PendingVerification_ShouldNotifySchoolPlanning()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingVerification,
            slaDeadline: DateTime.UtcNow.AddHours(-2),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "SchoolPlanning",
                "error",
                "ISNAD SLA Breached",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_VerificationDue_ShouldNotifySchoolPlanning()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.VerificationDue,
            slaDeadline: DateTime.UtcNow.AddHours(-1),
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "SchoolPlanning",
                "error",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_InvestmentAgencyReview_ShouldNotifyAssetManager()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.InvestmentAgencyReview,
            slaDeadline: DateTime.UtcNow.AddMinutes(-30),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "AssetManager",
                "error",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_PendingCeo_ShouldNotifyCeo()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingCeo,
            slaDeadline: DateTime.UtcNow.AddDays(-1),
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "CEO",
                "error",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_PendingMinister_ShouldNotifyMinister()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingMinister,
            slaDeadline: DateTime.UtcNow.AddHours(-12),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Minister",
                "error",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_AlreadyBreached_ShouldNotProcessAgain()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingVerification,
            slaDeadline: DateTime.UtcNow.AddDays(-2),
            slaStatus: "breached");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_ApprovedForm_ShouldNotProcess()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.Approved,
            slaDeadline: DateTime.UtcNow.AddDays(-1),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        form.SlaStatus.Should().NotBe("breached");
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_RejectedForm_ShouldNotProcess()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.Rejected,
            slaDeadline: DateTime.UtcNow.AddDays(-1),
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_CancelledForm_ShouldNotProcess()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.Cancelled,
            slaDeadline: DateTime.UtcNow.AddDays(-1),
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_NoSlaDeadline_ShouldNotProcess()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingVerification,
            slaDeadline: null,
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_SlaDeadlineNotYetPassed_ShouldNotProcess()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.PendingVerification,
            slaDeadline: DateTime.UtcNow.AddDays(1),
            slaStatus: "on_track");

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        form.SlaStatus.Should().Be("on_track");
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckIsnadSlaDeadlinesAsync_DraftStatus_ShouldNotNotifySpecificRole()
    {
        // Arrange
        var form = CreateTestIsnadForm(
            status: IsnadStatus.Draft,
            slaDeadline: DateTime.UtcNow.AddHours(-1),
            slaStatus: null);

        var forms = new List<IsnadForm> { form };
        var formsDbSet = CreateMockDbSet(forms);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(formsDbSet.Object);

        var scheduledTasksService = new TestableScheduledTasksService(
            _dbContextMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);

        // Act
        await scheduledTasksService.TestCheckIsnadSlaDeadlinesAsync(CancellationToken.None);

        // Assert
        // Should notify Admin but not a specific role (Draft doesn't map to a role)
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                "Admin",
                "error",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        // Should not notify SchoolPlanning, AssetManager, CEO, or Minister for Draft status
        _notificationServiceMock.Verify(
            x => x.NotifyRoleAsync(
                It.Is<string>(r => r != "Admin"),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion
}

#region Testable Service Wrapper

/// <summary>
/// A testable wrapper around ScheduledTasksService that exposes private methods for testing.
/// </summary>
internal class TestableScheduledTasksService
{
    private readonly IAppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger _logger;

    public TestableScheduledTasksService(
        IAppDbContext dbContext,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task TestCheckExpiringContractsAsync(CancellationToken ct)
    {
        var thirtyDaysFromNow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Mark contracts as Expiring (30 days before end)
        var expiring = await _dbContext.Contracts
            .Where(c => c.Status == ContractStatus.Active && c.EndDate <= thirtyDaysFromNow && c.EndDate > today)
            .ToListAsync(ct);

        foreach (var contract in expiring)
        {
            contract.Status = ContractStatus.Expiring;
            contract.UpdatedAt = DateTimeOffset.UtcNow;

            await _notificationService.NotifyRoleAsync(
                "Admin",
                "warning",
                "Contract Expiring Soon",
                $"Contract '{contract.ContractCode}' will expire on {contract.EndDate:d}. Please review for renewal.",
                ct);
        }

        // Mark contracts as Expired
        var expired = await _dbContext.Contracts
            .Where(c => (c.Status == ContractStatus.Active || c.Status == ContractStatus.Expiring) && c.EndDate <= today)
            .ToListAsync(ct);

        foreach (var contract in expired)
        {
            contract.Status = ContractStatus.Expired;
            contract.UpdatedAt = DateTimeOffset.UtcNow;

            await _notificationService.NotifyRoleAsync(
                "Admin",
                "info",
                "Contract Expired",
                $"Contract '{contract.ContractCode}' has expired.",
                ct);
        }

        if (expiring.Count > 0 || expired.Count > 0)
        {
            await _dbContext.SaveChangesAsync(ct);
        }
    }

    public async Task TestCheckOverdueInstallmentsAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var overdue = await _dbContext.Installments
            .Include(i => i.Contract)
            .Where(i => i.Status == InstallmentStatus.Pending && i.DueDate < today)
            .ToListAsync(ct);

        foreach (var installment in overdue)
        {
            installment.Status = InstallmentStatus.Overdue;
            installment.UpdatedAt = DateTimeOffset.UtcNow;

            installment.AddDomainEvent(new Domain.Events.InstallmentOverdueEvent(
                installment.Id,
                installment.ContractId,
                installment.InstallmentNumber,
                installment.AmountDue));

            var title = "Installment Payment Overdue";
            var message = $"Installment #{installment.InstallmentNumber} for contract '{installment.Contract?.ContractCode}' " +
                         $"(Amount: {installment.AmountDue:C}) is overdue.";

            await _notificationService.NotifyRoleAsync("Admin", "warning", title, message, ct);

            if (installment.Contract != null)
            {
                var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == installment.Contract.InvestorId, ct);
                if (investor != null && !string.IsNullOrEmpty(investor.Email))
                {
                    try
                    {
                        await _emailService.SendAsync(
                            investor.Email,
                            title,
                            $"<h2>Payment Reminder</h2><p>{message}</p><p>Please make your payment as soon as possible.</p>",
                            ct);
                    }
                    catch (Exception)
                    {
                        // Log warning but continue
                    }
                }
            }
        }

        if (overdue.Count > 0)
        {
            await _dbContext.SaveChangesAsync(ct);
        }
    }

    public async Task TestCheckIsnadSlaDeadlinesAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var breached = await _dbContext.IsnadForms
            .Where(f => f.SlaDeadline != null && f.SlaDeadline < now &&
                       f.SlaStatus != "breached" &&
                       f.Status != IsnadStatus.Approved &&
                       f.Status != IsnadStatus.Rejected &&
                       f.Status != IsnadStatus.Cancelled)
            .ToListAsync(ct);

        foreach (var form in breached)
        {
            form.SlaStatus = "breached";
            form.UpdatedAt = DateTimeOffset.UtcNow;

            var title = "ISNAD SLA Breached";
            var message = $"ISNAD form '{form.ReferenceNumber}' has breached its SLA deadline. " +
                         $"Current stage: {form.CurrentStage}. Deadline was: {form.SlaDeadline:g}.";

            await _notificationService.NotifyRoleAsync("Admin", "error", title, message, ct);

            var roleToNotify = form.Status switch
            {
                IsnadStatus.PendingVerification or IsnadStatus.VerificationDue => "SchoolPlanning",
                IsnadStatus.InvestmentAgencyReview => "AssetManager",
                IsnadStatus.PendingCeo => "CEO",
                IsnadStatus.PendingMinister => "Minister",
                _ => null
            };

            if (!string.IsNullOrEmpty(roleToNotify))
            {
                await _notificationService.NotifyRoleAsync(roleToNotify, "error", title, message, ct);
            }
        }

        if (breached.Count > 0)
        {
            await _dbContext.SaveChangesAsync(ct);
        }
    }
}

#endregion

#region Async Test Helpers

internal class ScheduledTasksTestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public ScheduledTasksTestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }
}

internal class ScheduledTasksTestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public ScheduledTasksTestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new ScheduledTasksTestAsyncEnumerable<T>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new ScheduledTasksTestAsyncEnumerable<TElement>(expression);
    }

    public object? Execute(Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                name: nameof(IQueryProvider.Execute),
                genericParameterCount: 1,
                types: new[] { typeof(Expression) })!
            .MakeGenericMethod(expectedResultType)
            .Invoke(_inner, new[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(expectedResultType)
            .Invoke(null, new[] { executionResult })!;
    }
}

internal class ScheduledTasksTestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public ScheduledTasksTestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    {
    }

    public ScheduledTasksTestAsyncEnumerable(Expression expression)
        : base(expression)
    {
    }

    IQueryProvider IQueryable.Provider => new ScheduledTasksTestAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new ScheduledTasksTestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }
}

#endregion
