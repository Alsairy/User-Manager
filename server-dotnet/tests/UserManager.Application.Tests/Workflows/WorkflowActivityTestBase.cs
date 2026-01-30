using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Workflows;

/// <summary>
/// Base class for workflow activity tests providing common mock setup utilities.
/// </summary>
public abstract class WorkflowActivityTestBase
{
    protected Mock<IAppDbContext> DbContextMock { get; private set; } = null!;
    protected Mock<INotificationService> NotificationServiceMock { get; private set; } = null!;
    protected Mock<IEmailService> EmailServiceMock { get; private set; } = null!;
    protected Mock<IServiceProvider> ServiceProviderMock { get; private set; } = null!;

    protected void InitializeMocks()
    {
        DbContextMock = new Mock<IAppDbContext>();
        NotificationServiceMock = new Mock<INotificationService>();
        EmailServiceMock = new Mock<IEmailService>();
        ServiceProviderMock = new Mock<IServiceProvider>();

        ServiceProviderMock
            .Setup(x => x.GetService(typeof(IAppDbContext)))
            .Returns(DbContextMock.Object);
        ServiceProviderMock
            .Setup(x => x.GetService(typeof(INotificationService)))
            .Returns(NotificationServiceMock.Object);
        ServiceProviderMock
            .Setup(x => x.GetService(typeof(IEmailService)))
            .Returns(EmailServiceMock.Object);
    }

    protected static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<T>>();

        mockDbSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new WorkflowTestAsyncEnumerator<T>(queryable.GetEnumerator()));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new WorkflowTestAsyncQueryProvider<T>(queryable.Provider));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.GetEnumerator())
            .Returns(() => queryable.GetEnumerator());

        mockDbSet.Setup(x => x.Add(It.IsAny<T>()))
            .Callback<T>(entity => data.Add(entity));

        mockDbSet.Setup(x => x.AddAsync(It.IsAny<T>(), It.IsAny<CancellationToken>()))
            .Callback<T, CancellationToken>((entity, ct) => data.Add(entity))
            .ReturnsAsync((T entity, CancellationToken ct) => null!);

        return mockDbSet;
    }

    protected static Asset CreateTestAsset(
        Guid? id = null,
        string name = "Test Asset",
        string code = "AST-001",
        AssetStatus status = AssetStatus.Draft,
        string? createdBy = null)
    {
        return new Asset
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
            NameAr = name,
            Code = code,
            Status = status,
            CreatedBy = createdBy ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    protected static Contract CreateTestContract(
        Guid? id = null,
        string contractCode = "CNT-001",
        ContractStatus status = ContractStatus.Draft,
        Guid? investorId = null,
        decimal totalAmount = 100000m,
        int? installmentCount = 12,
        InstallmentFrequency frequency = InstallmentFrequency.Monthly)
    {
        return new Contract
        {
            Id = id ?? Guid.NewGuid(),
            ContractCode = contractCode,
            Status = status,
            InvestorId = investorId ?? Guid.NewGuid(),
            TotalContractAmount = totalAmount,
            InstallmentCount = installmentCount,
            InstallmentFrequency = frequency,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            SigningDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    protected static IsnadForm CreateTestIsnadForm(
        Guid? id = null,
        string referenceNumber = "ISNAD-001",
        IsnadStatus status = IsnadStatus.Draft,
        string? createdBy = null)
    {
        return new IsnadForm
        {
            Id = id ?? Guid.NewGuid(),
            Title = "Test ISNAD Form",
            ReferenceNumber = referenceNumber,
            Status = status,
            CreatedBy = createdBy ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    protected static User CreateTestUser(
        Guid? id = null,
        string email = "test@example.com",
        string fullName = "Test User",
        UserStatus status = UserStatus.Active)
    {
        return new User
        {
            Id = id ?? Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            Status = status,
            PasswordHash = "hashed-password",
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    protected static Investor CreateTestInvestor(
        Guid? id = null,
        string email = "investor@example.com",
        string nameEn = "Test Investor")
    {
        return new Investor
        {
            Id = id ?? Guid.NewGuid(),
            InvestorCode = "INV-001",
            NameEn = nameEn,
            NameAr = nameEn,
            Email = email,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    protected static Installment CreateTestInstallment(
        Guid contractId,
        int number = 1,
        decimal amount = 1000m,
        DateOnly? dueDate = null,
        InstallmentStatus status = InstallmentStatus.Pending)
    {
        return new Installment
        {
            Id = Guid.NewGuid(),
            ContractId = contractId,
            InstallmentNumber = number,
            AmountDue = amount,
            DueDate = dueDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}

#region Workflow Test Async Helpers

internal class WorkflowTestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public WorkflowTestAsyncEnumerator(IEnumerator<T> inner)
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

internal class WorkflowTestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public WorkflowTestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new WorkflowTestAsyncEnumerable<T>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new WorkflowTestAsyncEnumerable<TElement>(expression);
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

internal class WorkflowTestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public WorkflowTestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    {
    }

    public WorkflowTestAsyncEnumerable(Expression expression)
        : base(expression)
    {
    }

    IQueryProvider IQueryable.Provider => new WorkflowTestAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new WorkflowTestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }
}

#endregion
